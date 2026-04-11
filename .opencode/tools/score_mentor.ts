import { z } from "zod"

const ScoreArgs = {
  research_overlap: z.number().min(0).max(30),
  direction_continuity: z.number().min(0).max(15),
  admissions_stability: z.number().min(0).max(15),
  goal_alignment: z.number().min(0).max(15),
  productivity_signal: z.number().min(0).max(10),
  public_info_completeness: z.number().min(0).max(5),
  risk_penalty: z.number().min(0).max(10)
}

export default {
  description: "Score mentor fit and return total plus qualitative band",
  args: ScoreArgs,
  async execute(args: {
    research_overlap: number
    direction_continuity: number
    admissions_stability: number
    goal_alignment: number
    productivity_signal: number
    public_info_completeness: number
    risk_penalty: number
  }) {
    const positive =
      args.research_overlap +
      args.direction_continuity +
      args.admissions_stability +
      args.goal_alignment +
      args.productivity_signal +
      args.public_info_completeness

    const total = Math.max(0, positive - args.risk_penalty)

    return {
      total,
      band: total >= 60 ? "strong-fit" : total >= 45 ? "medium-fit" : "weak-fit"
    }
  }
}
