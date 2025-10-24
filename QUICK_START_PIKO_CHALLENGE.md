# 🚀 Quick Start: Piko Challenge

## To Test the Challenge RIGHT NOW:

### 1. Add Restaurant Background (REQUIRED)
Download any restaurant interior image and save it as:
```
public/Backgrounds/restaurant/restaurant-scene.jpg
```

**Free sources:**
- https://www.pexels.com/search/restaurant/
- https://unsplash.com/s/photos/restaurant
- https://pixabay.com/images/search/restaurant/

### 2. Start Dev Server
```bash
npm run dev
```

### 3. Navigate to Challenge
```
http://localhost:3000/piko-challenge/restaurant-ordering-level1
```

### 4. Test the Experience

1. **Intro Card** should appear with "PIKO NEEDS YOUR HELP!"
2. Click **START CHALLENGE**
3. Checklist appears in top-right corner
4. Piko says: "I'm so nervous! What should I say when the waiter comes?"
5. **Teach Piko** by speaking:
   - "Say hello to the waiter"
   - "Use the word please"
   - "Tell them what food you want"
   - "Say thank you after"
   - "Ask questions if you're confused"
6. Watch checklist items ✅ check off as you teach
7. When all 5 complete → **Success dialog** appears!
8. Click "Try Again" to restart

## 🐛 If Something Doesn't Work:

### Checklist not updating?
Open browser console (F12) and look for:
```
🎯 Challenge tool call received
✅ Marking todo X as complete
📋 ChallengeChecklist received update
```

### Piko not responding?
Check that:
- Microphone permission granted
- Audio is enabled in browser
- Console shows "Connected" status

### Background not showing?
- Verify file exists at exact path: `public/Backgrounds/restaurant/restaurant-scene.jpg`
- Try refreshing page (Ctrl+R)
- Check browser console for 404 errors

## 📚 Documentation

- **Full Architecture**: `PIKO_CHALLENGES.md`
- **Implementation Details**: `PIKO_CHALLENGE_IMPLEMENTATION_SUMMARY.md`
- **Code**: `src/components/piko-challenges/`

## 🎯 What Should Happen

When working correctly:
- ✅ Piko acts confused and nervous
- ✅ Piko validates child's advice ("Oh! So I should...")
- ✅ Checklist updates in real-time
- ✅ All 5 objectives can be completed
- ✅ Success celebration when done
- ✅ Can restart and try again

---

**Route**: `/piko-challenge/restaurant-ordering-level1`  
**Status**: Ready for testing once background image added  
**Time to test**: ~5 minutes
