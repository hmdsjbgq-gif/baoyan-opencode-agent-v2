import { z } from "zod"

const CITY_LIST = [
  "北京",
  "上海",
  "杭州",
  "深圳",
  "广州",
  "南京",
  "苏州",
  "武汉",
  "西安",
  "成都",
  "重庆",
  "天津",
  "长沙",
  "青岛",
  "厦门",
  "合肥",
  "宁波",
  "无锡",
  "大连",
  "哈尔滨",
  "长春",
  "沈阳",
  "福州",
  "济南",
  "郑州"
] as const

const DIRECTION_PATTERNS = [
  ["机器学习", ["机器学习", "machine learning", "ml"]],
  ["深度学习", ["深度学习", "deep learning", "dl"]],
  ["人工智能", ["人工智能", "ai"]],
  ["计算机视觉", ["计算机视觉", "cv", "视觉"]],
  ["自然语言处理", ["自然语言处理", "nlp"]],
  ["大模型", ["大模型", "llm"]],
  ["多模态", ["多模态"]],
  ["知识图谱", ["知识图谱"]],
  ["图神经网络", ["图神经网络", "gnn"]],
  ["强化学习", ["强化学习", "rl"]],
  ["推荐系统", ["推荐系统"]],
  ["数据挖掘", ["数据挖掘"]],
  ["信息安全", ["信息安全", "网络安全", "安全"]],
  ["计算机系统", ["系统", "操作系统", "体系结构", "编译"]],
  ["数据库", ["数据库"]],
  ["分布式系统", ["分布式"]],
  ["机器人", ["机器人"]],
  ["集成电路", ["芯片", "集成电路", "ic"]],
  ["通信", ["通信"]],
  ["控制", ["控制", "自动化"]]
] as const

const SCHOOL_PATTERNS = [
  ["北京大学", ["北京大学", "北大"]],
  ["清华大学", ["清华大学", "清华"]],
  ["浙江大学", ["浙江大学", "浙大"]],
  ["上海交通大学", ["上海交通大学", "上交", "上交大"]],
  ["复旦大学", ["复旦大学", "复旦"]],
  ["南京大学", ["南京大学", "南大"]],
  ["中国科学院大学", ["中国科学院大学", "国科大"]],
  ["中国科学技术大学", ["中国科学技术大学", "中科大"]],
  ["哈尔滨工业大学", ["哈尔滨工业大学", "哈工大"]],
  ["西安交通大学", ["西安交通大学", "西交", "西交大"]],
  ["华中科技大学", ["华中科技大学", "华科"]],
  ["武汉大学", ["武汉大学", "武大"]],
  ["同济大学", ["同济大学", "同济"]],
  ["东南大学", ["东南大学", "东大"]],
  ["北京航空航天大学", ["北京航空航天大学", "北航"]],
  ["北京理工大学", ["北京理工大学", "北理"]],
  ["天津大学", ["天津大学", "天大"]],
  ["南开大学", ["南开大学", "南开"]],
  ["中国海洋大学", ["中国海洋大学", "海大"]]
] as const

const DIRECTION_ALIAS_TO_LABEL = new Map(
  DIRECTION_PATTERNS.flatMap(([label, aliases]) =>
    aliases.map(alias => [alias.toLowerCase(), label] as const)
  )
)

const SCHOOL_ALIAS_TO_LABEL = new Map(
  SCHOOL_PATTERNS.flatMap(([label, aliases]) =>
    aliases.map(alias => [alias.toLowerCase(), label] as const)
  )
)

type ContextProfile = Record<string, any>
type ContextMemory = Record<string, any>

function cleanText(value: string) {
  return value.replace(/\s+/g, " ").trim()
}

function normalizeDirectionToken(token: string) {
  return cleanText(token)
    .replace(/^(偏|做|想做|方向是|研究方向是|研究|主攻)/, "")
    .replace(/^(还是)?(保留|继续|不变|先保留|暂时保留)$/, "")
    .replace(/^(cv)$/i, "计算机视觉")
}

function normalizeMentorName(name: string) {
  return cleanText(name).replace(/^(准备联系|联系|套磁|找|跟|咨询|问询)/, "")
}

function unique<T>(items: T[]) {
  return [...new Set(items)]
}

function normalizeMessage(message: string) {
  return cleanText(message).replace(/[（）]/g, match => (match === "（" ? "(" : ")"))
}

function matchFirst(message: string, patterns: RegExp[]) {
  for (const pattern of patterns) {
    const matched = message.match(pattern)
    if (matched?.[1]) return cleanText(matched[1])
  }
  return ""
}

function detectGrade(message: string) {
  const map: Array<[RegExp, string]> = [
    [/(大二暑假|大二升大三暑假|暑假后大三)/, "sophomore_summer"],
    [/(大三上|大三上学期|junior fall)/i, "junior_fall"],
    [/(大三下|大三下学期|junior spring)/i, "junior_spring"],
    [/(大三暑假|大三升大四暑假)/, "junior_summer"],
    [/(大四上|大四上学期|senior fall)/i, "senior_fall"],
    [/(大四下|大四下学期|senior spring)/i, "senior_spring"],
    [/(已毕业|毕业了|graduated)/i, "graduated"]
  ]

  for (const [pattern, value] of map) {
    if (pattern.test(message)) return value
  }
  return ""
}

function detectStage(message: string) {
  if (/(夏令营)/.test(message)) return "summer_camp"
  if (/(预推免|预推|九推)/.test(message)) return "pre_recommendation"
  if (/(offer|择校|决策|比较 offer)/i.test(message)) return "offer_choice"
  if (/(准备阶段|前期准备|刚开始准备|早期准备|刚开始了解)/.test(message)) return "early_prep"
  return ""
}

function detectGpa(message: string) {
  return matchFirst(message, [
    /(?:GPA|gpa|绩点)\s*[:：]?\s*([0-9]+(?:\.[0-9]+)?(?:\s*\/\s*[0-9]+(?:\.[0-9]+)?)?)/,
    /均绩\s*[:：]?\s*([0-9]+(?:\.[0-9]+)?)/,
    /加权(?:平均分)?\s*[:：]?\s*([0-9]+(?:\.[0-9]+)?)/ 
  ])
}

function detectRank(message: string) {
  const direct = matchFirst(message, [
    /(?:排名|rank|专业排名|年级排名)\s*[:：]?\s*(\d+\s*\/\s*\d+)/i,
    /(?:专业|年级)?第\s*(\d+\s*\/\s*\d+)/
  ])
  if (direct) return direct.replace(/\s+/g, "")

  const topMatch = message.match(/(?:专业|年级)?前\s*(\d+)\s*\/\s*(\d+)/)
  if (topMatch) return `${topMatch[1]}/${topMatch[2]}`
  return ""
}

function detectRankPercent(message: string) {
  const value = matchFirst(message, [
    /(?:排名百分比|rank percent|前)\s*[:：]?\s*([0-9]+(?:\.[0-9]+)?%)/i,
    /top\s*([0-9]+(?:\.[0-9]+)?%)/i
  ])
  return value
}

function detectEnglish(message: string) {
  const english: Record<string, string> = {}

  const cet4 = matchFirst(message, [/(?:四级|CET-?4)\s*[:：]?\s*([0-9]{3})/i])
  const cet6 = matchFirst(message, [/(?:六级|CET-?6)\s*[:：]?\s*([0-9]{3})/i])
  const toefl = matchFirst(message, [/(?:托福|TOEFL)\s*[:：]?\s*([0-9]{2,3})/i])
  const ielts = matchFirst(message, [/(?:雅思|IELTS)\s*[:：]?\s*([0-9](?:\.[0-9])?)/i])

  if (cet4) english.cet4 = cet4
  if (cet6) english.cet6 = cet6
  if (toefl) english.toefl = toefl
  if (ielts) english.ielts = ielts

  return english
}

function detectCities(message: string) {
  const normalized = message.replace(/[，、和及或\/]/g, " ")
  return unique(CITY_LIST.filter(city => normalized.includes(city)))
}

function splitSegments(message: string) {
  return message
    .split(/[，。；\n]/)
    .map(cleanText)
    .filter(Boolean)
}

function detectDegreeTypes(message: string) {
  const types: string[] = []
  if (/(学硕|学术型硕士|学术硕士)/.test(message)) types.push("学术硕士")
  if (/(专硕|专业型硕士|专业硕士)/.test(message)) types.push("专业硕士")
  if (/(直博|博士)/.test(message)) types.push("直博")
  return unique(types)
}

function detectDirections(message: string) {
  const lower = message.toLowerCase()
  const detected = DIRECTION_PATTERNS.filter(([, aliases]) =>
    aliases.some(alias => lower.includes(alias.toLowerCase()))
  ).map(([label]) => label)

  const explicit = matchFirst(message, [
    /(?:方向|研究方向|目标方向|想做|偏向|希望做)\s*[:：]?\s*([^，。；\n]+)/,
    /(?:主申|主攻)\s*([^，。；\n]+)/
  ])

  if (explicit) {
    const explicitTokens = explicit
      .split(/[、,，\/和及\s]+/)
      .map(normalizeDirectionToken)
      .filter(Boolean)
      .map(token => DIRECTION_ALIAS_TO_LABEL.get(token.toLowerCase()) || token)

    return unique([...detected, ...explicitTokens])
  }

  return unique(detected)
}

function getLastProfileTargetSchool(currentProfile: ContextProfile | undefined) {
  const schools = currentProfile?.application_state?.target_schools
  if (!Array.isArray(schools) || !schools.length) return ""
  return cleanText(schools[schools.length - 1]?.name || "")
}

function getLastProfileTargetMentor(currentProfile: ContextProfile | undefined) {
  const mentors = currentProfile?.application_state?.target_mentors
  if (!Array.isArray(mentors) || !mentors.length) return ""
  return cleanText(mentors[mentors.length - 1]?.name || "")
}

function getLastProfileDirection(currentProfile: ContextProfile | undefined) {
  const directions = currentProfile?.preferences?.target_directions
  if (!Array.isArray(directions) || !directions.length) return ""
  return cleanText(directions[directions.length - 1] || "")
}

function getContextEntity(
  currentProfile: ContextProfile | undefined,
  currentMemory: ContextMemory | undefined,
  key: "last_target_school" | "last_target_mentor" | "last_direction"
) {
  const fromMemory = cleanText(currentMemory?.recent_entities?.[key] || "")
  if (fromMemory) return fromMemory
  if (key === "last_target_school") return getLastProfileTargetSchool(currentProfile)
  if (key === "last_target_mentor") return getLastProfileTargetMentor(currentProfile)
  return getLastProfileDirection(currentProfile)
}

function getContextEntityList(
  currentProfile: ContextProfile | undefined,
  currentMemory: ContextMemory | undefined,
  key: "recent_target_schools" | "recent_target_mentors" | "recent_directions"
) {
  const fromMemory = currentMemory?.recent_entities?.[key]
  if (Array.isArray(fromMemory) && fromMemory.length) {
    return fromMemory.map(cleanText).filter(Boolean)
  }

  if (key === "recent_target_schools") {
    const schools = currentProfile?.application_state?.target_schools
    return Array.isArray(schools) ? schools.map((item: any) => cleanText(item?.name || "")).filter(Boolean) : []
  }

  if (key === "recent_target_mentors") {
    const mentors = currentProfile?.application_state?.target_mentors
    return Array.isArray(mentors) ? mentors.map((item: any) => cleanText(item?.name || "")).filter(Boolean) : []
  }

  const directions = currentProfile?.preferences?.target_directions
  return Array.isArray(directions) ? directions.map(cleanText).filter(Boolean) : []
}

function detectCareerGoal(message: string) {
  const candidates = [
    "读博",
    "高校教职",
    "科研院所",
    "工业界研究院",
    "大厂研发",
    "就业"
  ]
  return candidates.find(candidate => message.includes(candidate)) || ""
}

function detectSchool(message: string) {
  return matchFirst(message, [
    /(?:本科|来自|就读于|学校是|本科院校是)\s*[:：]?\s*([^，。；\n]+?(?:大学|学院))/,
    /我是([^，。；\n]+?(?:大学|学院))/,
    /([^，。；\n]+?(?:大学|学院))[^，。；\n]*专业/
  ])
}

function detectMajor(message: string) {
  const major = matchFirst(message, [
    /(?:专业是|本科专业是|我的专业是)\s*[:：]?\s*([^，。；\n]+)/,
    /(?:大学|学院)([^，。；\n]+?专业)(?:，|。|$)/,
    /(?:大学|学院)([^，。；\n]+?专业)/
  ])

  return major.replace(/^的/, "")
}

function detectMaterials(message: string) {
  const materials: Record<string, boolean> = {}
  const rules: Array<[string, keyof typeof materials, string[]]> = [
    ["cv", "cv", ["简历", "cv"]],
    ["ps", "ps", ["ps", "自述", "个人陈述", "statement"]],
    ["cold_email_ready", "cold_email_ready", ["套磁信", "套磁邮件", "邮件"]],
    ["transcript", "transcript", ["成绩单", "transcript"]]
  ]

  for (const [, key, aliases] of rules) {
    for (const alias of aliases) {
      const negative = new RegExp(`(?:${alias}).{0,6}(?:还没|尚未|没有|没准备|未准备|没写|未写|没做|未做)`)
      const positive = new RegExp(`(?:${alias}).{0,6}(?:准备好了|已准备|已经准备|写好了|有了|完成了|ok了|齐了)`)
      if (negative.test(message)) {
        materials[key] = false
        break
      }
      if (positive.test(message)) {
        materials[key] = true
        break
      }
    }
  }

  return materials
}

function detectFamilyConstraints(message: string) {
  const constraints: string[] = []
  const patterns = [
    /(不想去[^，。；\n]+)/,
    /(不能去[^，。；\n]+)/,
    /(希望离家近[^，。；\n]*)/,
    /(家里[^，。；\n]+)/
  ]

  for (const pattern of patterns) {
    const matched = message.match(pattern)
    if (matched?.[1]) constraints.push(cleanText(matched[1]))
  }

  return unique(constraints)
}

function detectMentorGroupReference(
  message: string,
  currentProfile: ContextProfile | undefined,
  currentMemory: ContextMemory | undefined
) {
  if (
    !/(他那个组|他的组|他那个实验室|他的实验室|他那个课题组|他的课题组|那个老师的组|那个导师的组|这个组|那个组|这个实验室|那个实验室|这个课题组|那个课题组|他组里|那个老师组里|那个导师组里)/.test(
      message
    )
  ) {
    return ""
  }
  return getContextEntity(currentProfile, currentMemory, "last_target_mentor")
}

function extractSchoolFromText(text: string) {
  const lower = text.toLowerCase()
  for (const alias of SCHOOL_ALIAS_TO_LABEL.keys()) {
    if (lower.includes(alias)) return SCHOOL_ALIAS_TO_LABEL.get(alias) || ""
  }

  const matched = text.match(/([^，。；、\s]{2,20}(?:大学|学院|研究院|研究所))/)
  return matched?.[1] ? cleanText(matched[1]) : ""
}

function detectStatus(segment: string) {
  if (/(已套磁|已联系|联系过|已发邮件)/.test(segment)) return "已套磁"
  if (/(继续联系|继续套磁|继续跟进|跟进一下)/.test(segment)) return "已套磁"
  if (/(待套磁|准备联系|准备套磁)/.test(segment)) return "待套磁"
  if (/(先联系|下周联系|之后联系)/.test(segment)) return "待套磁"
  if (/(未开始|还没开始)/.test(segment)) return "未开始"
  if (/(待回复|等回复)/.test(segment)) return "待回复"
  return ""
}

function detectTier(segment: string) {
  if (/冲/.test(segment)) return "冲"
  if (/稳/.test(segment)) return "稳"
  if (/保/.test(segment)) return "保"
  return ""
}

function detectTargetSchools(message: string, undergraduateSchool: string) {
  const intentSegments = splitSegments(message)
    .filter(segment => /(冲|稳|保|想投|目标|打算投|准备投|考虑|申|投递)/.test(segment))

  const targets = intentSegments
    .map(segment => {
      const name = extractSchoolFromText(segment)
      if (!name || name === undergraduateSchool) return null
      return {
        name,
        ...(detectTier(segment) ? { tier: detectTier(segment) } : {}),
        ...(detectStatus(segment) ? { status: detectStatus(segment) } : {})
      }
    })
    .filter(Boolean) as Array<Record<string, string>>

  return unique(targets.map(item => JSON.stringify(item))).map(item => JSON.parse(item))
}

function parseOrdinalIndex(segment: string) {
  const matched = segment.match(/第\s*([1234一二两三四])\s*(?:个|位|所)?/)
  if (!matched?.[1]) return null

  const raw = matched[1]
  const map: Record<string, number> = {
    "1": 0,
    "2": 1,
    "3": 2,
    "4": 3,
    "一": 0,
    "二": 1,
    "两": 1,
    "三": 2,
    "四": 3
  }
  return raw in map ? map[raw] : null
}

function selectEntitiesByReference(segment: string, items: string[]) {
  if (!items.length) return []

  const ordinalIndex = parseOrdinalIndex(segment)
  if (ordinalIndex !== null) {
    return items[ordinalIndex] ? [items[ordinalIndex]] : []
  }

  if (/(前两个|前两位|前两所|前2个|前2位|前2所|这两个|那两个|这两位|那两位|这两所|那两所)/.test(segment)) {
    return items.slice(0, 2)
  }

  if (/(后两个|后两位|后两所|最后两个|最后两位|最后两所)/.test(segment)) {
    return items.slice(-2)
  }

  return items.slice(0, 1)
}

function resolveContextTargetSchool(
  message: string,
  currentProfile: ContextProfile | undefined,
  currentMemory: ContextMemory | undefined
) {
  const segment = splitSegments(message).find(item =>
    /(这个学校|那个学校|这所学校|那所学校|这个项目|那个项目|这个院校|那个院校|这两个学校|那两个学校|这两所学校|那两所学校|前两个学校|前两所学校|第[一二两三四1234]个学校|第[一二两三四1234]所学校)/.test(item)
  )
  if (!segment) {
    return []
  }

  const contextualItems = getContextEntityList(currentProfile, currentMemory, "recent_target_schools")
  const candidates = selectEntitiesByReference(segment, contextualItems)
  if (!candidates.length) return []

  return candidates.map(name => ({
    name,
    ...(detectTier(segment) ? { tier: detectTier(segment) } : {}),
    ...(detectStatus(segment) ? { status: detectStatus(segment) } : {})
  }))
}

function detectTargetMentors(message: string, directions: string[]) {
  const segments = splitSegments(message)
    .filter(segment => /(老师|教授)/.test(segment) && /(导师|联系|套磁|投|跟|想找|考虑)/.test(segment))

  const mentors = segments
    .flatMap(segment => {
      const pieces = segment
        .split(/[和、及]/)
        .map(cleanText)
        .filter(Boolean)

      const school = extractSchoolFromText(segment)
      const segmentDirections = directions.filter(direction => segment.includes(direction))

      return pieces
        .map(piece => {
          const matched = piece.match(/([A-Za-z\u4e00-\u9fa5·]{2,12}(?:老师|教授))/)
          return matched?.[1] ? normalizeMentorName(matched[1]) : ""
        })
        .filter(Boolean)
        .filter(name => !/^(这个|那个|这位|那位|该)(老师|导师)$/.test(name))
        .filter(name => !/^(前两个|前两位|这两个|那两个|第[一二两三四1234]个)(老师|导师)$/.test(name))
        .map(name => ({
          name,
          ...(school ? { school } : {}),
          ...(segmentDirections.length ? { direction: segmentDirections.join("、") } : {}),
          ...(detectStatus(segment) ? { status: detectStatus(segment) } : {})
        }))
    }) as Array<Record<string, string>>

  return unique(mentors.map(item => JSON.stringify(item))).map(item => JSON.parse(item))
}

function resolveContextTargetMentor(
  message: string,
  directions: string[],
  currentProfile: ContextProfile | undefined,
  currentMemory: ContextMemory | undefined
) {
  const segment = splitSegments(message).find(item =>
    /(这个老师|那个老师|这位老师|那位老师|这个导师|那个导师|该导师|这位导师|那位导师|这两个老师|那两个老师|这两位老师|那两位老师|前两个老师|前两位老师|第[一二两三四1234]个老师|第[一二两三四1234]位老师|第[一二两三四1234]个导师|第[一二两三四1234]位导师)/.test(item)
  )
  if (!segment) {
    return []
  }

  const contextualItems = getContextEntityList(currentProfile, currentMemory, "recent_target_mentors")
  const candidates = selectEntitiesByReference(segment, contextualItems)
  if (!candidates.length) return []

  return candidates.map(name => ({
    name,
    ...(directions.length ? { direction: directions.join("、") } : {}),
    ...(detectStatus(segment) ? { status: detectStatus(segment) } : {})
  }))
}

function resolveContextDirections(
  message: string,
  currentProfile: ContextProfile | undefined,
  currentMemory: ContextMemory | undefined
) {
  const segment = splitSegments(message).find(item =>
    /(这个方向|那个方向|这条方向|那条方向|该方向|这两个方向|那两个方向|前两个方向|第[一二两三四1234]个方向)/.test(item)
  )
  if (!segment) return []
  const contextualItems = getContextEntityList(currentProfile, currentMemory, "recent_directions")
  return selectEntitiesByReference(segment, contextualItems)
}

export default {
  description:
    "Extract a best-effort student profile patch, memory notes, and follow-up questions from a free-form user message. " +
    "Use this before upsert_user_memory so casual user replies can still update the local profile automatically.",
  args: {
    message: z.string().describe("Latest user message in Chinese or English"),
    infer_open_questions: z.boolean().default(true),
    current_profile: z.record(z.any()).optional(),
    current_memory: z.record(z.any()).optional()
  },
  async execute(args: {
    message: string
    infer_open_questions: boolean
    current_profile?: Record<string, unknown>
    current_memory?: Record<string, unknown>
  }) {
    const message = normalizeMessage(args.message)
    const currentProfile = (args.current_profile || {}) as ContextProfile
    const currentMemory = (args.current_memory || {}) as ContextMemory
    const notes: string[] = []
    const openQuestions: string[] = []

    const grade = detectGrade(message)
    const currentStage = detectStage(message)
    const gpa = detectGpa(message)
    const rank = detectRank(message)
    const rankPercent = detectRankPercent(message)
    const english = detectEnglish(message)
    const cities = detectCities(message)
    const degreeTypes = detectDegreeTypes(message)
    const directions = unique([
      ...detectDirections(message),
      ...resolveContextDirections(message, currentProfile, currentMemory)
    ])
    const careerGoal = detectCareerGoal(message)
    const school = detectSchool(message)
    const major = detectMajor(message)
    const materialsReady = detectMaterials(message)
    const familyConstraints = detectFamilyConstraints(message)
    const mentorGroupReference = detectMentorGroupReference(message, currentProfile, currentMemory)
    const explicitTargetSchools = detectTargetSchools(message, school)
    const targetSchools = explicitTargetSchools.length
      ? explicitTargetSchools
      : resolveContextTargetSchool(message, currentProfile, currentMemory)
    const explicitTargetMentors = detectTargetMentors(message, directions)
    const targetMentors = explicitTargetMentors.length
      ? explicitTargetMentors
      : resolveContextTargetMentor(message, directions, currentProfile, currentMemory)
    const resolvedQuestions: string[] = []
    const schoolContextReferenced =
      /(这个学校|那个学校|这所学校|那所学校|这个项目|那个项目|这个院校|那个院校|这两个学校|那两个学校|这两所学校|那两所学校|前两个学校|前两所学校|后两个学校|后两所学校|最后两个学校|最后两所学校|第[一二两三四1234]个学校|第[一二两三四1234]所学校)/.test(
        message
      )
    const mentorContextReferenced =
      /(这个老师|那个老师|这位老师|那位老师|这个导师|那个导师|该导师|这位导师|那位导师|这两个老师|那两个老师|这两位老师|那两位老师|前两个老师|前两位老师|后两个老师|后两位老师|最后两个老师|最后两位老师|第[一二两三四1234]个老师|第[一二两三四1234]位老师|第[一二两三四1234]个导师|第[一二两三四1234]位导师)/.test(
        message
      )
    const directionContextReferenced =
      /(这个方向|那个方向|这条方向|那条方向|该方向|这两个方向|那两个方向|前两个方向|后两个方向|最后两个方向|第[一二两三四1234]个方向)/.test(
        message
      )

    if (directions.length) notes.push(`目标方向：${directions.join("、")}`)
    if (/(导师风格|组会|push|氛围|导师回复)/i.test(message)) {
      notes.push("用户当前关注导师风格/组内氛围类风险")
    }
    if (targetSchools.length && schoolContextReferenced) {
      notes.push(`本轮通过上下文解析学校指代：${targetSchools.map(item => item.name).join("、")}`)
    }
    if (targetMentors.length && mentorContextReferenced) {
      notes.push(`本轮通过上下文解析导师指代：${targetMentors.map(item => item.name).join("、")}`)
    }
    if (directions.length && directionContextReferenced) {
      notes.push(`本轮通过上下文解析方向指代：${directions.join("、")}`)
    }
    if (mentorGroupReference) {
      notes.push(`本轮通过上下文解析导师组/实验室指代：${mentorGroupReference}`)
    }

    if (args.infer_open_questions) {
      if ((gpa || rank || rankPercent) && !rankPercent) openQuestions.push("确认排名百分比")
      if (
        cities.length &&
        !degreeTypes.length &&
        (!Array.isArray(currentProfile?.preferences?.degree_type) ||
          currentProfile.preferences.degree_type.length === 0)
      ) {
        openQuestions.push("确认学位偏好（学硕/专硕/直博）")
      }
      if (
        !careerGoal &&
        /(就业|读博|科研院|大厂|高校)/.test(message) &&
        !cleanText(currentProfile?.preferences?.career_goal)
      ) {
        openQuestions.push("确认更偏就业还是读博")
      }
      if (
        directions.length &&
        !school &&
        (!cleanText(currentProfile?.basic?.school) || !cleanText(currentProfile?.basic?.major))
      ) {
        openQuestions.push("确认本科院校与专业")
      }
    }

    const profilePatch: Record<string, unknown> = {}

    if (school || major || grade) {
      profilePatch.basic = {
        ...(school ? { school } : {}),
        ...(major ? { major } : {}),
        ...(grade ? { grade } : {})
      }
    }

    if (gpa || rank || rankPercent || Object.keys(english).length) {
      profilePatch.academic = {
        ...(gpa ? { gpa } : {}),
        ...(rank ? { rank } : {}),
        ...(rankPercent ? { rank_percent: rankPercent } : {}),
        ...(Object.keys(english).length ? { english } : {})
      }
    }

    if (cities.length || degreeTypes.length || directions.length || careerGoal || familyConstraints.length) {
      profilePatch.preferences = {
        ...(cities.length ? { cities } : {}),
        ...(degreeTypes.length ? { degree_type: degreeTypes } : {}),
        ...(directions.length ? { target_directions: directions } : {}),
        ...(careerGoal ? { career_goal: careerGoal } : {}),
        ...(familyConstraints.length ? { family_constraints: familyConstraints } : {})
      }
    }

    if (Object.keys(materialsReady).length) {
      profilePatch.application_state = {
        ...((profilePatch.application_state as Record<string, unknown>) || {}),
        materials_ready: materialsReady
      }
    }

    if (targetSchools.length || targetMentors.length) {
      profilePatch.application_state = {
        ...((profilePatch.application_state as Record<string, unknown>) || {}),
        ...(targetSchools.length ? { target_schools: targetSchools } : {}),
        ...(targetMentors.length ? { target_mentors: targetMentors } : {})
      }
    }

    if (currentStage) profilePatch.current_stage = currentStage

    if (school && major) resolvedQuestions.push("确认本科院校与专业")
    if (rankPercent) resolvedQuestions.push("确认排名百分比")
    if (Object.keys(english).length) resolvedQuestions.push("确认英语成绩")
    if (degreeTypes.length) resolvedQuestions.push("确认学位偏好（学硕/专硕/直博）")
    if (careerGoal) resolvedQuestions.push("确认更偏就业还是读博")
    if (Object.keys(materialsReady).length) resolvedQuestions.push("确认材料准备情况")
    if (directions.length) resolvedQuestions.push("确认目标方向")

    return {
      profile_patch: profilePatch,
      notes: unique(notes),
      open_questions: unique(openQuestions),
      resolved_open_questions: unique(resolvedQuestions),
      recent_entities_patch: {
        ...(targetSchools.length ? { last_target_school: targetSchools[targetSchools.length - 1].name } : {}),
        ...(targetMentors.length ? { last_target_mentor: targetMentors[targetMentors.length - 1].name } : {}),
        ...(directions.length ? { last_direction: directions[directions.length - 1] } : {}),
        ...(cities.length ? { last_city: cities[cities.length - 1] } : {}),
        ...(targetSchools.length ? { recent_target_schools: targetSchools.map(item => item.name) } : {}),
        ...(targetMentors.length ? { recent_target_mentors: targetMentors.map(item => item.name) } : {}),
        ...(directions.length ? { recent_directions: directions } : {}),
        ...(cities.length ? { recent_cities: cities } : {})
      },
      extracted_fields: {
        basic: Object.keys((profilePatch.basic as Record<string, unknown>) || {}),
        academic: Object.keys((profilePatch.academic as Record<string, unknown>) || {}),
        preferences: Object.keys((profilePatch.preferences as Record<string, unknown>) || {}),
        application_state: Object.keys((profilePatch.application_state as Record<string, unknown>) || {}),
        current_stage: currentStage || undefined
      },
      extracted_entities: {
        target_schools: targetSchools,
        target_mentors: targetMentors
      }
    }
  }
}
