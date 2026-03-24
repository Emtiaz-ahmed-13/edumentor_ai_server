const catchAsync = require('../../../shared/catchAsync');
const sendResponse = require('../../utils/sendResponse');
const noteService = require('./note.service');

const uploadAndSummarize = catchAsync(async (req, res) => {
  const result = await noteService.uploadAndSummarize(req.file);
  
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'PDF processed and summarized successfully',
    data: result,
  });
});

const askQuestion = catchAsync(async (req, res) => {
  const { noteId, question } = req.body;
  const result = await noteService.askQuestion(noteId, question);
  
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Question answered successfully',
    data: result,
  });
});

module.exports = {
  uploadAndSummarize,
  askQuestion,
};
