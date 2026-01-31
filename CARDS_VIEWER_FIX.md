# Cards Viewer Fix & LockToggle Import Error Fix

**Date:** January 31, 2026  
**Status:** ✅ COMPLETE

## Issues Fixed

### 1. ✅ LockToggle Component Import Error

**Error Message:**
```
Unhandled Runtime Error
Error: Element type is invalid: expected a string (for built-in components) 
or a class/function (for composite components) but got: undefined. 
You likely forgot to export your component from the file it's defined in, 
or you might have mixed up default and named imports.

Check the render method of LockToggle.
```

**Root Cause:**
The `LockToggle.tsx` component was using absolute imports (`@/components/ui/...`) which were causing import resolution issues.

**Fix:**
Changed all imports in `LockToggle.tsx` to use relative paths:

```typescript
// Before (causing error)
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

// After (working)
import { Switch } from './switch'
import { Label } from './label'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './tooltip'
```

**Result:** ✅ LockToggle now renders correctly without errors

---

### 2. ✅ Viewers Can Edit Cards

**Problem:**
Viewers could see and interact with card management buttons (Edit, Update Barcode, Note, Delete) in the fullscreen card view, even though the buttons were disabled.

**Before:**
```typescript
<div className="mb-6">
  <h3>Gestisci</h3>
  <Button disabled={!canModify(card).allowed}>
    <Edit /> Modifica carta
  </Button>
  <Button disabled={!canDelete(card).allowed}>
    <Trash2 /> Elimina carta
  </Button>
</div>
```

**Issue:** Buttons were **disabled** but still **visible**, creating confusion for viewers.

**After:**
```typescript
{/* Management Section - only show if user has permissions */}
{!isViewer && (
  <div className="mb-6">
    <h3>Gestisci</h3>
    {canModify(card).allowed && (
      <Button>
        <Edit /> Modifica carta
      </Button>
    )}
    {canDelete(card).allowed && (
      <Button>
        <Trash2 /> Elimina carta
      </Button>
    )}
  </div>
)}
```

**Result:**
- ❌ Viewers don't see the "Gestisci" (Management) section at all
- ❌ Viewers don't see Edit button
- ❌ Viewers don't see Update Barcode button
- ❌ Viewers don't see Note button
- ❌ Viewers don't see Delete button
- ✅ Viewers can only VIEW the card details
- ✅ Members/Owners see buttons based on their permissions

---

## Files Modified

### 1. `components/ui/LockToggle.tsx`
**Change:** Fixed import paths from absolute to relative

**Lines changed:**
- Line 3: `Switch` import
- Line 4: `Label` import
- Lines 5-10: `Tooltip*` imports

### 2. `components/dashboard/CardsTab.tsx`
**Change:** Hide management section for viewers, conditionally show buttons based on permissions

**Lines changed:**
- Lines 569-643: Wrapped management section in `{!isViewer && (...)}`
- Each button now wrapped in permission check (e.g., `{canModify(card).allowed && (...)}`)

---

## Testing Checklist

### For Viewers (Card Fullscreen View)
- ✅ Can open card in fullscreen
- ✅ Can see card details (name, brand, number, barcode, etc.)
- ✅ Can see card notes if present
- ❌ **CANNOT** see "Gestisci" section
- ❌ **CANNOT** see any management buttons
- ❌ **CANNOT** edit card information
- ❌ **CANNOT** update barcode
- ❌ **CANNOT** delete card

### For Members (Card Fullscreen View)
- ✅ Can open card in fullscreen
- ✅ Can see card details
- ✅ **CAN** see "Gestisci" section
- ✅ **CAN** see Edit button (for own & public cards)
- ✅ **CAN** see Update Barcode button (for own & public cards)
- ✅ **CAN** see Note button (for own & public cards)
- ✅ **CAN** see Delete button (for own cards only)
- ❌ **CANNOT** edit private cards owned by others

### For Owners (Card Fullscreen View)
- ✅ Can open card in fullscreen
- ✅ Can see card details
- ✅ **CAN** see "Gestisci" section
- ✅ **CAN** see ALL management buttons
- ✅ **CAN** edit ANY card
- ✅ **CAN** delete ANY card
- ✅ Full control over all cards

---

## Card Management Buttons Breakdown

| Button | Purpose | Owner | Member | Viewer |
|--------|---------|-------|--------|--------|
| **Modifica carta** (Edit) | Edit card details | ✅ All | ✅ Own+Public | ❌ Hidden |
| **Update Barcode** | Rescan/update barcode | ✅ All | ✅ Own+Public | ❌ Hidden |
| **Nota** (Note) | View/edit notes | ✅ All | ✅ Own+Public | ❌ Hidden |
| **Elimina carta** (Delete) | Delete the card | ✅ All | ✅ Own | ❌ Hidden |

**Section Visibility:**
- **"Gestisci" Section**: Shown to Owners/Members, Hidden for Viewers

---

## Benefits

1. **Clean Viewer UX**: Viewers see a simple, view-only card display without confusing disabled buttons
2. **No Runtime Errors**: LockToggle component loads correctly
3. **Consistent Pattern**: Same permission-based UI hiding as other tabs
4. **Clear Permissions**: Each button checks specific permissions before rendering
5. **Better Performance**: Fewer DOM elements for viewers (entire section not rendered)

---

## Complete Card Tab Status

| Feature | Owner | Member | Viewer | Status |
|---------|-------|--------|--------|--------|
| View cards list | ✅ | ✅ | ✅ | ✅ Working |
| Open fullscreen | ✅ | ✅ | ✅ | ✅ Working |
| See management section | ✅ | ✅ | ❌ | ✅ Fixed |
| Edit button | ✅ All | ✅ Own+Public | ❌ | ✅ Fixed |
| Update barcode | ✅ All | ✅ Own+Public | ❌ | ✅ Fixed |
| Delete button | ✅ All | ✅ Own | ❌ | ✅ Fixed |
| Lock toggle (in forms) | ✅ | ❌ | ❌ | ✅ Working |
| Create new card | ✅ | ✅ | ❌ | ✅ Working |

---

## Summary

**Issues Resolved:**
1. ✅ LockToggle import error fixed (relative paths)
2. ✅ Viewers can't see card management buttons
3. ✅ Clean UI for viewers (no disabled buttons)
4. ✅ Proper permission checks for each action

**User Experience:**
- **Viewers**: Simple, clean, view-only card display
- **Members**: Full management for own/public cards
- **Owners**: Complete control over all cards

**Technical Quality:**
- ✅ No linter errors
- ✅ No runtime errors
- ✅ Consistent with other tabs
- ✅ Production-ready

The Cards tab is now **fully functional** with proper viewer restrictions! 🎉
