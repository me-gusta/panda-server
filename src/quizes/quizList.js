export default {
  onboarding: {
    "questions": [
      {
        "text": "Кто вы такой?",
        "accept": "text"
      },
      {
        "text": "Что вы хотите?",
        "accept": "text"
      }
    ],
    onEnd: async (user) => {
      user.state = 'unassigned'
    }
  }

}
