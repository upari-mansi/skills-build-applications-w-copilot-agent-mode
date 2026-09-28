import mongoose from 'mongoose';

const options = { timestamps: true, strict: false };

const userSchema = new mongoose.Schema(
  {
    username: { type: String, trim: true, index: true },
    email: { type: String, trim: true, lowercase: true, unique: true, sparse: true },
    firstName: { type: String, trim: true },
    lastName: { type: String, trim: true },
    teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
  },
  options,
);

const teamSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, index: true },
    description: { type: String, trim: true },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  options,
);

const activitySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    activityType: { type: String, trim: true },
    durationMinutes: { type: Number, min: 0 },
    distance: { type: Number, min: 0 },
    points: { type: Number, min: 0, default: 0 },
    date: { type: Date, default: Date.now },
  },
  options,
);

const leaderboardSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
    points: { type: Number, min: 0, default: 0 },
    rank: { type: Number, min: 1 },
  },
  options,
);

const workoutSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, index: true },
    description: { type: String, trim: true },
    activityType: { type: String, trim: true },
    difficulty: { type: String, trim: true },
    durationMinutes: { type: Number, min: 0 },
  },
  options,
);

export const User = mongoose.models.User ?? mongoose.model('User', userSchema);
export const Team = mongoose.models.Team ?? mongoose.model('Team', teamSchema);
export const Activity = mongoose.models.Activity ?? mongoose.model('Activity', activitySchema);
export const Leaderboard = mongoose.models.Leaderboard ?? mongoose.model('Leaderboard', leaderboardSchema);
export const Workout = mongoose.models.Workout ?? mongoose.model('Workout', workoutSchema);