const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');


// Define the Reaction Schema
const ReactionSchema = new mongoose.Schema({
  reaction: String,
  sentiment: { type: String, enum: ['positive', 'negative', 'neutral'] },
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
    const { reaction } = req.body;

    if (!reaction) {
      return res.status(400).json({ message: 'Reaction is required' });
    }

    const sentiment = getSentiment(reaction);

    // Save reaction to MongoDB
    const newReaction = new Reaction({ reaction, sentiment });
    await newReaction.save();

    // Recalculate sentiment scores
    const positive = await Reaction.countDocuments({ sentiment: 'positive' });
    const negative = await Reaction.countDocuments({ sentiment: 'negative' });
    const neutral = await Reaction.countDocuments({ sentiment: 'neutral' });

    return res.status(200).json({
      message: 'Reaction received',
      sentimentScores: { positive, negative, neutral },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error', error });
  }
});

// GET /api/sentiment - Get sentiment and emoji counts
router.get('/sentiment', async (req, res) => {
  try {
    // Aggregate emoji counts
    const emojiCountsFromDB = await Reaction.aggregate([
      { $group: { _id: "$reaction", count: { $sum: 1 } } }
    ]);

    // Merge with predefined emojis
    const emojiCounts = predefinedEmojis.reduce((acc, emoji) => {
      const emojiFromDB = emojiCountsFromDB.find((e) => e._id === emoji);
      acc[emoji] = emojiFromDB ? emojiFromDB.count : 0;
      return acc;
    }, {});

    // Recalculate sentiment scores
    const positive = await Reaction.countDocuments({ sentiment: 'positive' });
    const negative = await Reaction.countDocuments({ sentiment: 'negative' });
    const neutral = await Reaction.countDocuments({ sentiment: 'neutral' });

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

module.exports = router;
