const cloudinary = require("cloudinary").v2;
const stream = require("stream");

const sendResponse = require("../../utils/sendResponse");
const Note = require("./note.model");
const noteService = require("./note.service");

// Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ─── Upload Note Controller ───────────────────────────────────────────────────
const uploadNote = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "PDF file is required",
      });
    }

    const userId = req.auth?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { buffer, originalname } = req.file;

    try {
      console.log("📄 Extracting text from:", originalname);
      const { text: extractedText, pageCount } = await noteService.extractTextFromBuffer(buffer);
      const wordCount = extractedText.trim().split(/\s+/).length;

      console.log(`📊 Extracted ${wordCount} words across ${pageCount} page(s). Generating AI summary with 500-word chunks...`);
      const summary = await noteService.generateSummary(extractedText);
      console.log("✅ AI Summary generated using vectorless RAG. Starting Cloudinary upload...");

      const bufferStream = new stream.PassThrough();
      bufferStream.end(buffer);

      bufferStream.pipe(
        cloudinary.uploader.upload_stream(
          {
            resource_type: "raw",
            public_id: `edumentor_notes/${userId}/${Date.now()}_${originalname.replace(".pdf", "")}`,
          },
          async (error, uploadResult) => {
            if (error) {
              console.error("Cloudinary upload error:", error);
              return next(error);
            }

            try {
              const noteResult = await Note.create({
                title: summary.title || originalname.replace(".pdf", ""),
                content: extractedText,
                summary: summary,
                fileUrl: uploadResult.secure_url,
                userId: userId,
                pageCount: pageCount || 0,
                wordCount: wordCount || 0,
              });

              sendResponse(res, {
                statusCode: 200,
                success: true,
                message: "Note uploaded, summarized with 500-word RAG chunks, and saved successfully!",
                data: {
                  _id: noteResult._id,
                  title: noteResult.title,
                  fileUrl: noteResult.fileUrl,
                  pageCount: noteResult.pageCount,
                  wordCount: noteResult.wordCount,
                  summary: noteResult.summary,
                  createdAt: noteResult.createdAt,
                },
              });
            } catch (err) {
              console.error("Error saving note to DB:", err);
              next(err);
            }
          }
        )
      );
    } catch (processError) {
      console.error("Error processing note content:", processError);
      return next(processError);
    }
  } catch (error) {
    console.error("Upload note error:", error);
    next(error);
  }
};

// ─── Get All Notes ────────────────────────────────────────────────────────────
const getAllNotes = async (req, res, next) => {
  try {
    const { userId } = req.auth;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const result = await Note.find({ userId })
      .select("-content") // exclude raw PDF text from list view
      .sort({ createdAt: -1 });

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Notes retrieved successfully!",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// ─── Get Note By ID ───────────────────────────────────────────────────────────
const getNoteById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.auth?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const result = await Note.findOne({ _id: id, userId });

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Note not found",
      });
    }

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Note retrieved successfully!",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// ─── Update Note (title) ─────────────────────────────────────────────────────
const updateNote = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title } = req.body;
    const userId = req.auth?.userId;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (!title || typeof title !== "string" || title.trim().length === 0) {
      return res.status(400).json({ success: false, message: "Title is required" });
    }

    const note = await Note.findOneAndUpdate(
      { _id: id, userId },
      { $set: { title: title.trim() } },
      { new: true }
    ).select("-content");

    if (!note) {
      return res.status(404).json({ success: false, message: "Note not found" });
    }

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Note updated successfully!",
      data: note,
    });
  } catch (error) {
    next(error);
  }
};

// ─── Delete Note ─────────────────────────────────────────────────────────────
const deleteNote = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.auth?.userId;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const deleted = await Note.findOneAndDelete({ _id: id, userId });

    if (!deleted) {
      return res.status(404).json({ success: false, message: "Note not found" });
    }

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Note deleted successfully!",
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

// ─── Ask a Question from an Uploaded Note (Document Q&A) ─────────────────────
const askFromNote = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { question } = req.body;
    const userId = req.auth?.userId;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (!question) {
      return res.status(400).json({ success: false, message: "Question is required" });
    }

    const note = await Note.findOne({ _id: id, userId });
    if (!note) {
      return res.status(404).json({ success: false, message: "Note not found" });
    }

    console.log(`🔍 Answering question from note "${note.title}": ${question}`);
    const answer = await noteService.generateAnswerFromNote(note.content, question);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Answer generated from your note!",
      data: {
        noteTitle: note.title,
        question,
        ...answer,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadNote,
  getAllNotes,
  getNoteById,
  updateNote,
  deleteNote,
  askFromNote,
};
