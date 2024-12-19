const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');


// Define the Reaction Schema
const ReactionSchema = new mongoose.Schema({
  reaction: String,
  sentiment: { type: String, enum: ['positive', 'negative', 'neutral'] },
  eventId: { type: String, required: true },
  userId: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

// Create Reaction Model
const Reaction = mongoose.model('Reaction', ReactionSchema);

// Predefined list of emojis
const predefinedEmojis = [
  "👍",
  "👎",
  "❤️",
  "🤮",
  "🤩",
  "😡",
  "😁",
  "😭",
  "👏",
  "😍",
];

// Helper function to determine sentiment
const getSentiment = (reaction) => {
  const positiveEmojis = ["❤️", "👍", "😊", "😁", "😍", "👏"];
  const negativeEmojis = ["😡", "👎", "😭", "🤮"];
  if (positiveEmojis.includes(reaction)) return 'positive';
  if (negativeEmojis.includes(reaction)) return 'negative';
  return 'neutral';
};

// POST /api/reactions - Submit a reaction
router.post('/reactions', async (req, res) => {
  try {
    const { reaction, eventId, userId } = req.body;

    if (!reaction || !eventId || !userId) {
      return res.status(400).json({ message: 'Reaction, eventId and userId are required' });
    }

    const sentiment = getSentiment(reaction);

    // Save reaction to MongoDB
    const newReaction = new Reaction({ 
      reaction, 
      sentiment,
      eventId,
      userId,
      timestamp: new Date()
    });
    await newReaction.save();

    // Recalculate sentiment scores
    const positive = await Reaction.countDocuments({ sentiment: 'positive', eventId });
    const negative = await Reaction.countDocuments({ sentiment: 'negative', eventId });
    const neutral = await Reaction.countDocuments({ sentiment: 'neutral', eventId });

    return res.status(200).json({
      message: 'Reaction received',
      sentimentScores: { positive, negative, neutral },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error', error });
  }
});

// GET /api/sentiment - Get sentiment and emoji counts for an event
router.get('/sentiment', async (req, res) => {
  try {
    const { eventId } = req.query;
    
    if (!eventId) {
      return res.status(400).json({ message: 'EventId is required' });
    }

    // Aggregate emoji counts
    const emojiCountsFromDB = await Reaction.aggregate([
      { $match: { eventId } },
      { $group: { _id: "$reaction", count: { $sum: 1 } } }
    ]);

    // Merge with predefined emojis
    const emojiCounts = predefinedEmojis.reduce((acc, emoji) => {
      const emojiFromDB = emojiCountsFromDB.find((e) => e._id === emoji);
      acc[emoji] = emojiFromDB ? emojiFromDB.count : 0;
      return acc;
    }, {});

    // Recalculate sentiment scores
    const positive = await Reaction.countDocuments({ sentiment: 'positive', eventId });
    const negative = await Reaction.countDocuments({ sentiment: 'negative', eventId });
    const neutral = await Reaction.countDocuments({ sentiment: 'neutral', eventId });

    return res.status(200).json({
      positive,
      negative,
      neutral,
      emojiCounts,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error', error });
  }
});

// GET /api/reactions/user - Get all reactions for a user
router.get('/reactions/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const userReactions = await Reaction.find({ userId })
      .sort({ timestamp: -1 });
    
    return res.status(200).json(userReactions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error', error });
  }
});

// GET /api/reactions/event - Get all reactions for an event
router.get('/reactions/event/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;
    
    const eventReactions = await Reaction.find({ eventId })
      .sort({ timestamp: -1 });
    
    return res.status(200).json(eventReactions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error', error });
  }
});

module.exports = router;
