import { z } from "zod"

const ScoreArgs = {
  academic_fit: z.number().min(0).max(25),
  direction_fit: z.number().min(0).max(20),
  tier_fit: z.number().min(0).max(15),
  city_fit: z.number().min(0).max(10),
  resource_fit: z.number().min(0).max(10),
  outcome_fit: z.number().min(0).max(10),
  execution_fit: z.number().min(0).max(10)
}

export default {
  description: "Score school fit and return total plus qualitative band",
  args: ScoreArgs,
  async execute(args: {
    academic_fit: number
    direction_fit: number
    tier_fit: number
    city_fit: number
    resource_fit: number
    outcome_fit: number
    execution_fit: number
  }) {
    const total =
      args.academic_fit +
      args.direction_fit +
      args.tier_fit +
      args.city_fit +
      args.resource_fit +
      args.outcome_fit +
      args.execution_fit

    return {
      total,
      band: total >= 80 ? "strong-fit" : total >= 65 ? "medium-fit" : "weak-fit"
    }
  }
}
