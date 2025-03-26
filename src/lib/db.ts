import { getFirestore } from 'firebase-admin/firestore'
import { initializeApp, getApps, cert } from 'firebase-admin/app'

// Initialize Firebase Admin if it hasn't been initialized yet
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  })
}

const db = getFirestore()

// Default user data structure
const defaultUserData = {
  profile: {
    name: 'Guest User',
    image: '/placeholder.svg?height=40&width=40'
  },
  finances: {
    income: { amount: 0 },
    expenses: {
      amount: 0,
      needsPercentage: 0,
      wantsPercentage: 0
    },
    savings: { percentage: 0 },
    goals: [{
      name: 'Set Your First Goal',
      target: 0,
      current: 0
    }]
  },
  budget: {
    categories: []
  }
}

export async function getUserData(userId: string) {
  if (!userId) {
    throw new Error('User ID is required')
  }

  // Return default data for the default user
  if (userId === 'default') {
    return {
      name: defaultUserData.profile.name,
      profileImage: defaultUserData.profile.image,
      incomeVsExpenses: {
        income: defaultUserData.finances.income.amount,
        expenses: defaultUserData.finances.expenses.amount,
      },
      savingsProgress: defaultUserData.finances.savings.percentage,
      nextGoal: {
        name: defaultUserData.finances.goals[0].name,
        target: defaultUserData.finances.goals[0].target,
        current: defaultUserData.finances.goals[0].current,
      },
      expenseBreakdown: {
        needs: defaultUserData.finances.expenses.needsPercentage,
        wants: defaultUserData.finances.expenses.wantsPercentage,
        savings: defaultUserData.finances.savings.percentage,
      },
      budgetComparison: {
        categories: [],
        budget: [],
        actual: [],
      },
    }
  }

  try {
    const userRef = db.collection('users').doc(userId)
    const userDoc = await userRef.get()
    
    if (!userDoc.exists) {
      throw new Error('User not found')
    }

    const userData = userDoc.data()
    
    if (!userData) {
      throw new Error('User data is empty')
    }

    // Validate required data structures
    if (!userData.finances || !userData.profile) {
      throw new Error('Invalid user data structure')
    }

    return {
      name: userData.profile.name || 'User',
      profileImage: userData.profile.image || '/placeholder.svg?height=40&width=40',
      incomeVsExpenses: {
        income: userData.finances.income?.amount || 0,
        expenses: userData.finances.expenses?.amount || 0,
      },
      savingsProgress: userData.finances.savings?.percentage || 0,
      nextGoal: {
        name: userData.finances.goals?.[0]?.name || 'Emergency Fund',
        target: userData.finances.goals?.[0]?.target || 100000,
        current: userData.finances.goals?.[0]?.current || 0,
      },
      expenseBreakdown: {
        needs: userData.finances.expenses?.needsPercentage || 0,
        wants: userData.finances.expenses?.wantsPercentage || 0,
        savings: userData.finances.savings?.percentage || 0,
      },
      budgetComparison: {
        categories: userData.budget?.categories?.map((c: any) => c.name) || [],
        budget: userData.budget?.categories?.map((c: any) => c.budgeted) || [],
        actual: userData.budget?.categories?.map((c: any) => c.actual) || [],
      },
    }
  } catch (error) {
    console.error('Error fetching user data:', error)
    throw error
  }
} 