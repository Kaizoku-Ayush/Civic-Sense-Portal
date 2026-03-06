import axios from 'axios';
import FormData from 'form-data';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

/**
 * Call the FastAPI AI microservice to classify an image.
 * @param {Buffer} imageBuffer – raw image bytes
 * @param {string} mimeType – e.g. 'image/jpeg'
 * @param {boolean} useGroq – whether to include Groq LLM analysis
 * @returns {Object} prediction result from FastAPI
 */
export async function classifyImage(imageBuffer, mimeType = 'image/jpeg', useGroq = true) {
  const form = new FormData();
  form.append('file', imageBuffer, {
    filename: 'issue.jpg',
    contentType: mimeType,
  });
  form.append('use_groq', String(useGroq));

  const response = await axios.post(`${AI_SERVICE_URL}/predict`, form, {
    headers: form.getHeaders(),
    timeout: 30_000,
  });

  return response.data;
}

/**
 * Check if the AI service is healthy / reachable.
 */
export async function checkAIHealth() {
  try {
    const response = await axios.get(`${AI_SERVICE_URL}/health`, { timeout: 5_000 });
    return response.data;
  } catch {
    return { status: 'unreachable', model_loaded: false, groq_enabled: false };
  }
}
