# Future Features — Admin Panel

## 1. Save Profile (Settings Page)

**Status:** Removed (deferred)  
**File:** `admin/settings.html`  
**JS:** `admin/js/settings.js`

### What it does
Allows the admin to update their profile (name, bio, profile picture) and persist changes to the database.

### How to re-enable

1. **Add the button back** to `admin/settings.html` inside the `<form>`, after the bio textarea:

```html
<div class="flex justify-end pt-4">
  <button id="save-profile" class="px-6 py-3 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-primary-dim transition-all" type="button">
    Save Profile Updates
  </button>
</div>
```

2. **Add the JS handler** to `admin/js/settings.js`:

```javascript
function wireSaveButton() {
  const saveBtn = document.getElementById('save-profile');
  if (saveBtn) {
    saveBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      const name = document.getElementById('settings-name').value;
      const bio = document.getElementById('settings-bio').value;

      try {
        await fetchAdmin('/settings/profile', {
          method: 'PATCH',
          body: JSON.stringify({ name, bio }),
        });
        showToast('Profile updated successfully!');
      } catch (err) {
        showToast('Failed to save profile', 'error');
      }
    });
  }
}
```

3. **Call `wireSaveButton()`** inside the `DOMContentLoaded` handler in `settings.js`.

4. **Create the API route** in `admin/server/routes/` for `PATCH /api/admin/settings/profile`:

```javascript
router.patch('/settings/profile', async (req, res) => {
  const { name, bio } = req.body;
  // Get user ID from Clerk auth
  const userId = req.auth?.userId;
  const updated = await prisma.user.update({
    where: { clerkId: userId },
    data: { name, bio },
  });
  res.json({ user: updated });
});
```

### Related IDs in HTML
- `#save-profile` — The save button
- `#settings-name` — Name input field
- `#settings-email` — Email field (disabled, read-only)
- `#settings-bio` — Bio textarea
- `#profile-picture` — Profile image element
