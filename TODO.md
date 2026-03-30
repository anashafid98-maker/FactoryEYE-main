# FactoryEYE Equipment Fix - TODO
Status: 🔄 In Progress | Priority: HIGH

## Plan Steps (Approved by User)

### ✅ 1. Create this TODO.md [DONE]
### ✅ 2. Fix App.tsx (duplicate ErrorBoundary)
### ✅ 3. Refactor Equipment.tsx (Hooks to top + sub-components)
### ⏳ 4. Test EquipmentTest.tsx (working baseline)
### ⏳ 5. Test full Equipment page with graphs
### ⏳ 6. Verify live/historic modes + zoom/pan
### ⏳ 7. Backend API status check (ports 5000/5001)

## Commands to Run After:
```bash
cd frontend
npm run dev
# Visit http://localhost:5173/equipment
# Check F12 console for API status
```

## Success Criteria:
- [ ] No ErrorBoundary crash
- [ ] Graphs render immediately
- [ ] Live data refreshes (if backend up)
- [ ] Zoom/pan/metric selector works

**Next**: Step 2 - App.tsx fix

