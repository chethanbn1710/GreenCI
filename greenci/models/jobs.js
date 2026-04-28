const mongoose = require("mongoose")

const StageSchema = new mongoose.Schema({
  name: String,
  status: String,
  logs: [String]
})

const JobSchema = new mongoose.Schema({
  repo: String,
  branch: String,
  language: String,
  commit: String,
  clone_url: String,
  languages_url: String,
  status: String,
  workerId: Number,
  createdAt: Date,
  startedAt: Date,
  completedAt: Date,
  stages: [StageSchema]
})

module.exports = mongoose.model("Job", JobSchema)