import mongoose from 'mongoose';
import { Activity, Leaderboard, Team, User, Workout } from '../models/index.js';

const connectionString = process.env.MONGODB_URI || 'mongodb://localhost:27017/octofit_db';
const upsertOptions = { upsert: true, returnDocument: 'after' as const, setDefaultsOnInsert: true };

const seedUsers = [
  { username: 'maya.chen', email: 'maya.chen@example.com', firstName: 'Maya', lastName: 'Chen', grade: 10 },
  { username: 'jordan.rivera', email: 'jordan.rivera@example.com', firstName: 'Jordan', lastName: 'Rivera', grade: 11 },
  { username: 'sam.patel', email: 'sam.patel@example.com', firstName: 'Sam', lastName: 'Patel', grade: 9 },
  { username: 'alex.morgan', email: 'alex.morgan@example.com', firstName: 'Alex', lastName: 'Morgan', grade: 10 },
];

const seedTeams = [
  {
    name: 'Trailblazers',
    description: 'A running and walking team that enjoys exploring new routes.',
    members: ['maya.chen@example.com', 'jordan.rivera@example.com'],
  },
  {
    name: 'Peak Performers',
    description: 'A mixed-training team focused on steady progress and support.',
    members: ['sam.patel@example.com', 'alex.morgan@example.com'],
  },
];

const seedActivities = [
  { email: 'maya.chen@example.com', activityType: 'Running', durationMinutes: 32, distance: 4.8, points: 48, date: '2026-09-25T16:00:00.000Z' },
  { email: 'maya.chen@example.com', activityType: 'Strength Training', durationMinutes: 35, points: 35, date: '2026-09-23T16:00:00.000Z' },
  { email: 'jordan.rivera@example.com', activityType: 'Cycling', durationMinutes: 45, distance: 12.5, points: 50, date: '2026-09-26T15:30:00.000Z' },
  { email: 'jordan.rivera@example.com', activityType: 'Walking', durationMinutes: 28, distance: 2.3, points: 23, date: '2026-09-22T15:30:00.000Z' },
  { email: 'sam.patel@example.com', activityType: 'Basketball', durationMinutes: 40, points: 40, date: '2026-09-25T17:00:00.000Z' },
  { email: 'sam.patel@example.com', activityType: 'Running', durationMinutes: 24, distance: 3.2, points: 32, date: '2026-09-21T17:00:00.000Z' },
  { email: 'alex.morgan@example.com', activityType: 'Swimming', durationMinutes: 30, distance: 1.0, points: 36, date: '2026-09-24T16:30:00.000Z' },
  { email: 'alex.morgan@example.com', activityType: 'Walking', durationMinutes: 35, distance: 2.8, points: 28, date: '2026-09-20T16:30:00.000Z' },
];

const seedWorkouts = [
  {
    name: 'After-School Easy Run',
    description: 'A relaxed run with a short warm-up and cool-down.',
    activityType: 'Cardio',
    difficulty: 'Beginner',
    durationMinutes: 25,
  },
  {
    name: 'Bodyweight Strength Circuit',
    description: 'Three rounds of squats, incline push-ups, lunges, and planks.',
    activityType: 'Strength',
    difficulty: 'Intermediate',
    durationMinutes: 30,
  },
  {
    name: 'Mobility and Recovery',
    description: 'Gentle full-body mobility work with controlled breathing.',
    activityType: 'Mobility',
    difficulty: 'Beginner',
    durationMinutes: 18,
  },
];

/**
 * Seed the octofit_db database with test data
 */
async function seedDatabase(): Promise<void> {
  try {
    await mongoose.connect(connectionString);

    console.log('Connected to octofit_db');

    const users = await Promise.all(
      seedUsers.map((user) => User.findOneAndUpdate({ email: user.email }, { $set: user }, upsertOptions)),
    );
    const userByEmail = new Map(users.map((user) => [user.email, user]));

    const teams = await Promise.all(
      seedTeams.map((team) => {
        const members = team.members.map((email) => userByEmail.get(email)?._id).filter(Boolean);
        return Team.findOneAndUpdate(
          { name: team.name },
          { $set: { name: team.name, description: team.description, members } },
          upsertOptions,
        );
      }),
    );
    const teamByName = new Map(teams.map((team) => [team.name, team]));

    for (const activity of seedActivities) {
      const user = userByEmail.get(activity.email);
      if (!user) {
        throw new Error(`Missing seeded user: ${activity.email}`);
      }

      const date = new Date(activity.date);
      await Activity.findOneAndUpdate(
        { userId: user._id, activityType: activity.activityType, date },
        {
          $set: {
            userId: user._id,
            activityType: activity.activityType,
            durationMinutes: activity.durationMinutes,
            distance: activity.distance,
            points: activity.points,
            date,
          },
        },
        upsertOptions,
      );
    }

    const pointsByEmail = new Map(seedUsers.map((user) => [user.email, 0]));
    for (const activity of seedActivities) {
      pointsByEmail.set(activity.email, (pointsByEmail.get(activity.email) ?? 0) + activity.points);
    }

    const rankedUsers = seedUsers
      .map((user) => ({ user, points: pointsByEmail.get(user.email) ?? 0 }))
      .sort((first, second) => second.points - first.points);

    for (const [index, entry] of rankedUsers.entries()) {
      const user = userByEmail.get(entry.user.email);
      const teamDefinition = seedTeams.find((seededTeam) => seededTeam.members.includes(entry.user.email));
      const team = teamDefinition ? teamByName.get(teamDefinition.name) : undefined;
      if (!user) {
        throw new Error(`Missing seeded user: ${entry.user.email}`);
      }

      await Leaderboard.findOneAndUpdate(
        { userId: user._id },
        { $set: { userId: user._id, teamId: team?._id, points: entry.points, rank: index + 1 } },
        upsertOptions,
      );
    }

    await Promise.all(
      seedWorkouts.map((workout) =>
        Workout.findOneAndUpdate({ name: workout.name }, { $set: workout }, upsertOptions),
      ),
    );

    console.log(
      `Seeded ${users.length} users, ${teams.length} teams, ${seedActivities.length} activities, ${rankedUsers.length} leaderboard entries, and ${seedWorkouts.length} workouts.`,
    );
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

void seedDatabase();
