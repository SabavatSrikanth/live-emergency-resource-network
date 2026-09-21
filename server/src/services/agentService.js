const { ChatGoogleGenerativeAI } = require("@langchain/google-genai");
const { DynamicStructuredTool } = require("@langchain/core/tools");
const { ChatPromptTemplate, MessagesPlaceholder } = require("@langchain/core/prompts");
const { HumanMessage, AIMessage, SystemMessage } = require("@langchain/core/messages");
const { z } = require("zod");
const mongoose = require('mongoose');

let AgentExecutor, createToolCallingAgent;
try {
  const agents = require("langchain/agents");
  AgentExecutor = agents.AgentExecutor;
  createToolCallingAgent = agents.createToolCallingAgent;
} catch (e) {
  // Graceful fallback if langchain agents subpath is not exported
}

// Note: Since we might use seedData when DB is not connected
const seedData = require('../utils/seedData');
const Incident = require('../models/Incident');
const Resource = require('../models/Resource');

const isDbConnected = () => mongoose.connection.readyState === 1;

// Define Tools
const queryIncidentsTool = new DynamicStructuredTool({
  name: "query_incidents",
  description: "Search for active emergency incidents in the LERN system. Useful for finding out how many emergencies are active, their status, or location.",
  schema: z.object({
    status: z.string().optional().describe("Filter by status (e.g., VERIFYING, RESPONDING, RESOLVED)"),
    category: z.string().optional().describe("Filter by category (e.g., Fire, Flood, Medical)")
  }),
  func: async ({ status, category }) => {
    try {
      if (isDbConnected()) {
        let query = {};
        if (status) query.status = status;
        if (category) query.category = category;
        const incidents = await Incident.find(query);
        return JSON.stringify(incidents);
      } else {
        let incidents = seedData.getIncidents();
        if (status) incidents = incidents.filter(i => i.status === status);
        if (category) incidents = incidents.filter(i => i.category === category);
        return JSON.stringify(incidents);
      }
    } catch (e) {
      return `Error querying incidents: ${e.message}`;
    }
  }
});

const queryResourcesTool = new DynamicStructuredTool({
  name: "query_resources",
  description: "Search for available emergency resources in the LERN system (e.g., Hospital Beds, Ambulances, Fire Tenders, Rescue Squads). Useful to know what can be deployed.",
  schema: z.object({
    type: z.string().optional().describe("Filter by resource type (e.g., Hospital Beds, Ambulances, Fire Tenders)")
  }),
  func: async ({ type }) => {
    try {
      if (isDbConnected()) {
        let query = {};
        if (type) query.type = type;
        const resources = await Resource.find(query);
        return JSON.stringify(resources);
      } else {
        let resources = seedData.getResources();
        if (type) resources = resources.filter(r => r.type === type);
        return JSON.stringify(resources);
      }
    } catch (e) {
      return `Error querying resources: ${e.message}`;
    }
  }
});

const tools = [queryIncidentsTool, queryResourcesTool];

// Initialize the model
const getModel = () => {
  return new ChatGoogleGenerativeAI({
    modelName: "gemini-1.5-flash",
    maxOutputTokens: 2048,
    apiKey: process.env.GEMINI_API_KEY || "dummy-key-for-build" // Ensure it doesn't crash if missing immediately
  });
};

// Create the Chat Agent
const createChatAgent = async () => {
  const llm = getModel();
  const prompt = ChatPromptTemplate.fromMessages([
    ["system", "You are the LERN Command AI Dispatcher. You manage emergency incidents and resources. You must use tools to check live data before answering. Do not guess the number of incidents or resources. Your answers must be based purely on the tool outputs. Be professional, urgent, and concise."],
    new MessagesPlaceholder("chat_history"),
    ["human", "{input}"],
    new MessagesPlaceholder("agent_scratchpad"),
  ]);

  const agent = createToolCallingAgent({
    llm,
    tools,
    prompt,
  });

  return new AgentExecutor({
    agent,
    tools,
  });
};

// Memory store for simple chat history (in-memory for demo purposes)
const chatMemory = {};

const handleAgenticChat = async (sessionId, input) => {
  try {
    if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key') {
      const executor = await createChatAgent();
      if (!chatMemory[sessionId]) chatMemory[sessionId] = [];
      const result = await executor.invoke({
        input,
        chat_history: chatMemory[sessionId]
      });
      chatMemory[sessionId].push(new HumanMessage(input));
      chatMemory[sessionId].push(new AIMessage(result.output));
      if (chatMemory[sessionId].length > 10) chatMemory[sessionId] = chatMemory[sessionId].slice(-10);
      return result.output;
    }
  } catch (err) {
    // Fall through to live database query engine
  }

  // Live Database Query Fallback Engine
  const incidents = isDbConnected() ? await Incident.find() : seedData.getIncidents();
  const resources = isDbConnected() ? await Resource.find() : seedData.getResources();

  const activeIncidents = incidents.filter(i => i.status !== 'RESOLVED');
  const criticalCount = activeIncidents.filter(i => i.priority === 'CRITICAL').length;
  const hospitalBeds = resources.filter(r => r.type === 'Hospital Beds').reduce((sum, r) => sum + (r.available || 0), 0);
  const ambulances = resources.filter(r => r.type === 'Ambulances').reduce((sum, r) => sum + (r.available || 0), 0);

  const lowerInput = (input || '').toLowerCase();
  if (lowerInput.includes('report') || lowerInput.includes('incident') || lowerInput.includes('emergency')) {
    if (activeIncidents.length === 0) {
      return `🚨 LERN System Status: Currently 0 active emergencies. All reported incidents are RESOLVED. Available ICU Beds: ${hospitalBeds}, Available Ambulances: ${ambulances}.`;
    }
    const incidentTitles = activeIncidents.slice(0, 3).map(i => `"${i.title}" (${i.priority} - ${i.status})`).join(', ');
    return `🚨 LERN System Status: Found ${activeIncidents.length} active emergency report(s) (${criticalCount} Critical). Active reports: ${incidentTitles}. Available ICU Beds: ${hospitalBeds}, Ambulances: ${ambulances}.`;
  } else if (lowerInput.includes('bed') || lowerInput.includes('hospital')) {
    return `🏥 LERN Hospital Network: Currently ${hospitalBeds} ICU beds available across network emergency facilities.`;
  } else if (lowerInput.includes('ambulance') || lowerInput.includes('ems')) {
    return `🚑 LERN EMS Fleet: Currently ${ambulances} Rapid Response Ambulances available on standby.`;
  }

  return `🤖 LERN Command AI: System operational. Currently tracking ${activeIncidents.length} active emergency incident(s), ${hospitalBeds} available ICU hospital beds, and ${ambulances} available ambulances.`;
};

// Function for Agentic Triage Plan Generation
const generateTriagePlan = async (incident) => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is missing. Cannot generate AI Triage Plan.");
  }

  const llm = getModel();
  
  // We use Zod to enforce the LLM's output structure
  const triageSchema = z.object({
    summary: z.string().describe("A brief summary of the proposed action plan"),
    confidenceScore: z.number().describe("Confidence score between 50 and 100"),
    recommendedActions: z.array(z.string()).describe("A list of 2 to 4 recommended actions"),
    recommendedResources: z.array(z.object({
      type: z.string(),
      qty: z.number()
    })).describe("List of resources to deploy based ONLY on what is currently available")
  });

  const structuredLlm = llm.withStructuredOutput(triageSchema);

  // We manually provide the LLM with the available resources so it can make an informed decision
  let availableResourcesContext = "";
  try {
    const resources = isDbConnected() ? await Resource.find() : seedData.getResources();
    const available = resources.filter(r => r.available > 0).map(r => `${r.type}: ${r.available} available`);
    availableResourcesContext = available.join(", ");
  } catch(e) {
    availableResourcesContext = "Could not fetch resources.";
  }

  const promptStr = `
    You are the LERN AI Triage Agent. A new emergency incident has been reported:
    Title: ${incident.title}
    Category: ${incident.category}
    Priority: ${incident.priority}
    Description: ${incident.description}
    Location: ${incident.location.address}

    Currently available resources in the system: ${availableResourcesContext}.
    
    Propose an automated triage plan. You MUST ONLY recommend deploying resources that are currently available in the system. Be highly logical and ensure the response perfectly matches the required JSON structure.
  `;

  const result = await structuredLlm.invoke([
    new SystemMessage(promptStr)
  ]);

  return {
    status: 'PROPOSED',
    summary: result.summary,
    confidenceScore: result.confidenceScore,
    recommendedActions: result.recommendedActions,
    recommendedResources: result.recommendedResources
  };
};

module.exports = {
  handleAgenticChat,
  generateTriagePlan
};
