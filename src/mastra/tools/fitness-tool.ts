import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

// 身体参数类型定义
interface BodyMetrics {
  height: number; // 身高 (cm)
  weight: number; // 体重 (kg)
  age: number; // 年龄
  gender: 'male' | 'female'; // 性别
  activityLevel: 1.2 | 1.375 | 1.55 | 1.725 | 1.9; // 活动系数
}

// 运动强度枚举
const ActivityLevels = {
  1.2: 'sedentary', // 久坐不动
  1.375: 'light', // 轻度活动 (每周1-3次)
  1.55: 'moderate', // 中等活动 (每周3-5次)
  1.725: 'active', // 高度活动 (每周6-7次)
  1.9: 'extreme' // 极度活动 (每日高强度运动)
} as const;

// 计算BMR和TDEE的工具
export const calorieCalculatorTool = createTool({
  id: 'calculate-calories',
  description: 'Calculate BMR (Basal Metabolic Rate) and TDEE (Total Daily Energy Expenditure)',
  inputSchema: z.object({
    height: z.number().min(100).max(250).describe('身高 (cm)'),
    weight: z.number().min(20).max(200).describe('体重 (kg)'),
    age: z.number().min(10).max(100).describe('年龄'),
    gender: z.enum(['male', 'female']).describe('性别'),
    activityLevel: z.enum(['1.2', '1.375', '1.55', '1.725', '1.9']).describe('运动强度系数')
  }),
  outputSchema: z.object({
    bmr: z.number().describe('基础代谢率 (卡路里/天)'),
    tdee: z.number().describe('总日消耗量 (卡路里/天)'),
    weightLoss: z.number().describe('减重所需热量 (卡路里/天)'),
    weightGain: z.number().describe('增重所需热量 (卡路里/天)'),
    activityDescription: z.string().describe('运动强度描述')
  }),
  execute: async ({ context }) => {
    const activityLevel = parseFloat(context.activityLevel) as keyof typeof ActivityLevels;
    return calculateCalories({
      height: context.height,
      weight: context.weight,
      age: context.age,
      gender: context.gender,
      activityLevel
    });
  },
});

// 生成饮食计划的工具
export const dietPlanTool = createTool({
  id: 'generate-diet-plan',
  description: 'Generate personalized diet plan based on calorie needs and goals',
  inputSchema: z.object({
    targetCalories: z.number().describe('目标热量摄入'),
    goal: z.enum(['lose', 'maintain', 'gain']).describe('目标：减重/维持/增重'),
    dietPreference: z.enum(['normal', 'vegetarian', 'keto', 'mediterranean']).optional().describe('饮食偏好')
  }),
  outputSchema: z.object({
    dailyPlan: z.object({
      breakfast: z.string(),
      lunch: z.string(),
      dinner: z.string(),
      snacks: z.string()
    }),
    macronutrients: z.object({
      protein: z.string(),
      carbs: z.string(),
      fat: z.string()
    }),
    tips: z.array(z.string())
  }),
  execute: async ({ context }) => {
    return generateDietPlan(context.targetCalories, context.goal, context.dietPreference);
  },
});

// 生成训练计划的工具
export const workoutPlanTool = createTool({
  id: 'generate-workout-plan',
  description: 'Generate personalized workout plan based on fitness level and goals',
  inputSchema: z.object({
    fitnessLevel: z.enum(['beginner', 'intermediate', 'advanced']).describe('健身水平'),
    goal: z.enum(['lose_weight', 'build_muscle', 'improve_endurance', 'general_fitness']).describe('健身目标'),
    daysPerWeek: z.number().min(1).max(7).describe('每周训练天数'),
    timePerSession: z.number().min(15).max(180).describe('每次训练时间(分钟)')
  }),
  outputSchema: z.object({
    weeklyPlan: z.array(z.object({
      day: z.string(),
      exercises: z.array(z.object({
        name: z.string(),
        sets: z.string(),
        reps: z.string(),
        rest: z.string()
      }))
    })),
    tips: z.array(z.string())
  }),
  execute: async ({ context }) => {
    return generateWorkoutPlan(
      context.fitnessLevel,
      context.goal,
      context.daysPerWeek,
      context.timePerSession
    );
  },
});

// 热量计算函数
function calculateCalories(metrics: BodyMetrics) {
  let bmr: number;
  
  // 使用Mifflin-St Jeor方程计算BMR
  if (metrics.gender === 'male') {
    bmr = 88.362 + (13.397 * metrics.weight) + (4.799 * metrics.height) - (5.677 * metrics.age);
  } else {
    bmr = 447.593 + (9.247 * metrics.weight) + (3.098 * metrics.height) - (4.330 * metrics.age);
  }
  
  const tdee = bmr * metrics.activityLevel;
  
  return {
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    weightLoss: Math.round(tdee - 500), // 减重：每日减少500卡路里
    weightGain: Math.round(tdee + 500), // 增重：每日增加500卡路里
    activityDescription: ActivityLevels[metrics.activityLevel]
  };
}

// 饮食计划生成函数
function generateDietPlan(targetCalories: number, goal: 'lose' | 'maintain' | 'gain', dietPreference?: string) {
  const proteinRatio = goal === 'gain' ? 0.3 : 0.25; // 蛋白质比例
  const carbRatio = goal === 'lose' ? 0.35 : 0.45; // 碳水化合物比例  
  const fatRatio = 1 - proteinRatio - carbRatio; // 脂肪比例
  
  const proteinCals = Math.round(targetCalories * proteinRatio);
  const carbCals = Math.round(targetCalories * carbRatio);
  const fatCals = Math.round(targetCalories * fatRatio);
  
  return {
    dailyPlan: {
      breakfast: `燕麦粥配水果和坚果 (~${Math.round(targetCalories * 0.25)}卡路里)`,
      lunch: `瘦肉/鱼肉配蔬菜和糙米 (~${Math.round(targetCalories * 0.35)}卡路里)`,
      dinner: `烤鸡胸肉配蔬菜沙拉 (~${Math.round(targetCalories * 0.3)}卡路里)`,
      snacks: `坚果、水果或酸奶 (~${Math.round(targetCalories * 0.1)}卡路里)`
    },
    macronutrients: {
      protein: `${Math.round(proteinCals / 4)}g (${proteinCals}卡路里)`,
      carbs: `${Math.round(carbCals / 4)}g (${carbCals}卡路里)`,
      fat: `${Math.round(fatCals / 9)}g (${fatCals}卡路里)`
    },
    tips: [
      '多喝水，每天至少8杯',
      '少食多餐，避免暴饮暴食',
      '选择天然未加工食品',
      '控制盐分和糖分摄入',
      '规律作息，充足睡眠'
    ]
  };
}

// 训练计划生成函数
function generateWorkoutPlan(
  fitnessLevel: 'beginner' | 'intermediate' | 'advanced',
  goal: 'lose_weight' | 'build_muscle' | 'improve_endurance' | 'general_fitness',
  daysPerWeek: number,
  timePerSession: number
) {
  const baseExercises = {
    beginner: [
      { name: '深蹲', sets: '2-3', reps: '8-12', rest: '60秒' },
      { name: '俯卧撑', sets: '2-3', reps: '5-10', rest: '60秒' },
      { name: '平板支撑', sets: '2-3', reps: '20-30秒', rest: '60秒' },
      { name: '快走', sets: '1', reps: '15-20分钟', rest: '无' }
    ],
    intermediate: [
      { name: '深蹲', sets: '3-4', reps: '10-15', rest: '45秒' },
      { name: '俯卧撑', sets: '3-4', reps: '10-15', rest: '45秒' },
      { name: '平板支撑', sets: '3', reps: '30-60秒', rest: '45秒' },
      { name: '慢跑', sets: '1', reps: '20-30分钟', rest: '无' },
      { name: '哑铃划船', sets: '3', reps: '10-12', rest: '45秒' }
    ],
    advanced: [
      { name: '深蹲', sets: '4-5', reps: '12-20', rest: '30秒' },
      { name: '俯卧撑变式', sets: '4', reps: '15-20', rest: '30秒' },
      { name: '平板支撑', sets: '3', reps: '60-90秒', rest: '30秒' },
      { name: '跑步', sets: '1', reps: '30-45分钟', rest: '无' },
      { name: '引体向上', sets: '3-4', reps: '5-12', rest: '45秒' }
    ]
  };
  
  const exercises = baseExercises[fitnessLevel];
  const weeklyPlan = [];
  
  for (let i = 0; i < daysPerWeek; i++) {
    weeklyPlan.push({
      day: `第${i + 1}天`,
      exercises: exercises.slice(0, Math.min(exercises.length, Math.floor(timePerSession / 15)))
    });
  }
  
  return {
    weeklyPlan,
    tips: [
      '训练前做5-10分钟热身',
      '训练后做拉伸放松',
      '循序渐进，避免过度训练',
      '保持动作标准，质量重于数量',
      '充分休息，肌肉在休息时生长',
      '如有疼痛立即停止训练'
    ]
  };
}