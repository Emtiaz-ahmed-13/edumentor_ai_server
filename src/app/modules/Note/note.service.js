const pdfParse = require('pdf-parse');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const config = require('../../../config');

const genAI = new GoogleGenerativeAI(config.gemini_api_key);

// Chunk text by word count (500 words per chunk)
const chunkByWords = (text, wordsPerChunk = 500) => {
  const words = text.split(/\s+/);
  const chunks = [];
  
  for (let i = 0; i < words.length; i += wordsPerChunk) {
    chunks.push(words.slice(i, i + wordsPerChunk).join(' '));
  }
  
  return chunks;
};

// Summarize a single chunk
const summarizeChunk = async (chunk, chunkIndex, totalChunks) => {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
  
  const prompt = `You are summarizing part ${chunkIndex + 1} of ${totalChunks} from a document.
Provide a concise summary of the following text chunk:

${chunk}

Summary:`;

  const result = await model.generateContent(prompt);
  return result.response.text();
};

// Consolidate all chunk summaries into final summary
const consolidateSummaries = async (chunkSummaries, originalText) => {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
  
  const prompt = `You have received summaries of different sections of a document.
Create a comprehensive, well-structured final summary that combines all these section summaries.

Section Summaries:
${chunkSummaries.map((summary, idx) => `\nSection ${idx + 1}:\n${summary}`).join('\n')}

Provide a final consolidated summary with:
1. Main Topic/Title
2. Key Points (bullet points)
3. Important Details
4. Conclusion

Final Summary:`;

  const result = await model.generateContent(prompt);
  return result.response.text();
};

const uploadAndSummarize = async (file) => {
  if (!file) {
    throw new Error('No file uploaded');
  }

  // Extract text from PDF
  const dataBuffer = file.buffer;
  const pdfData = await pdfParse(dataBuffer);
  const extractedText = pdfData.text;

  // Chunk the text by 500 words
  const chunks = chunkByWords(extractedText, 500);
  
  // Summarize each chunk
  const chunkSummaries = [];
  for (let i = 0; i < chunks.length; i++) {
    const summary = await summarizeChunk(chunks[i], i, chunks.length);
    chunkSummaries.push(summary);
  }
  
  // Consolidate all summaries
  const finalSummary = await consolidateSummaries(chunkSummaries, extractedText);

  return {
    fileName: file.originalname,
    totalChunks: chunks.length,
    wordsPerChunk: 500,
    extractedText,
    chunkSummaries,
    finalSummary,
  };
};

const askQuestion = async (noteId, question) => {
  // This would typically retrieve the note from database
  // For now, returning a placeholder
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
  
  const prompt = `Answer the following question based on the document context:

Question: ${question}

Answer:`;

  const result = await model.generateContent(prompt);
  
  return {
    question,
    answer: result.response.text(),
  };
};

module.exports = {
  uploadAndSummarize,
  askQuestion,
};
