import { z } from "zod"
import dayjs from "dayjs"

const STAGE_TASKS = {
  early_prep: {
    this_week: ["补全画像", "梳理科研/项目经历", "建立首版院校池"],
    this_month: ["建立导师池", "准备简历", "准备首版套磁材料"]
  },
  summer_camp: {
    this_week: ["核查已发布通知", "优先投递临近截止项目", "更新简历与成绩信息"],
    this_month: ["跟进套磁", "准备面试问答", "补充英语或科研证明"]
  },
  pre_recommendation: {
    this_week: ["收敛目标名单", "确认导师沟通状态", "核对材料版本"],
    this_month: ["准备复试/面试", "持续跟踪通知", "比较多个机会的优先级"]
  },
  offer_choice: {
    this_week: ["整理 offer 条件", "比较导师与方向", "评估城市与就业导向"],
    this_month: ["完成最终决策", "准备后续联系材料", "归档已核实信息"]
  }
}

export default {
  description: "Build a dated action timeline based on the current application stage",
  args: {
    stage: z
      .enum(["early_prep", "summer_camp", "pre_recommendation", "offer_choice"])
      .describe("Current application stage"),
    start_date: z
      .string()
      .optional()
      .describe(
        "ISO date string for the start of the timeline window (defaults to today). " +
        "Example: '2026-04-11'"
      )
  },
  async execute(args: {
    stage: "early_prep" | "summer_camp" | "pre_recommendation" | "offer_choice"
    start_date?: string
  }) {
    const base = args.start_date ? dayjs(args.start_date) : dayjs()
    const weekEnd = base.add(6, "day")
    const monthEnd = base.add(30, "day")

    const tasks = STAGE_TASKS[args.stage]

    return {
      stage: args.stage,
      this_week: {
        label: `本周（${base.format("MM/DD")} – ${weekEnd.format("MM/DD")}）`,
        tasks: tasks.this_week
      },
      this_month: {
        label: `本月（${base.format("MM/DD")} – ${monthEnd.format("MM/DD")}）`,
        tasks: tasks.this_month
      }
    }
  }
}
