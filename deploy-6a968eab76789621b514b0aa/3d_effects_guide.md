# 🎬 Redheart Glass & Aluminum — 3D Cabinet Effects Guide

## Overview
Your website now features **advanced interactive 3D rotating cabinet effects** that engage visitors when they hover over product images. These effects create a premium, modern experience that showcases your products dynamically.

---

## 🎯 New 3D Effects Implemented

### 1. **Interactive 3D Cabinet Rotation**
**Location:** Gallery items (`.gallery-item`)

When users hover over a cabinet/product image:
- The cabinet **automatically rotates** in 3D space using `rotateX`, `rotateY`, and `rotateZ`
- Movement starts with an auto-rotating animation (continuous spin)
- When the mouse moves, the rotation **follows the cursor position**
- The image scales up to **1.15x** for emphasis

**Technical Details:**
```javascript
// Auto-rotation on hover
rotateX(20deg) rotateY(360deg) rotateZ(8deg) scale(1.1)

// Cursor-based rotation
rotateX(${rotX}deg) rotateY(${rotY}deg) rotateZ(${tiltZ}deg) scale(1.15)
```

### 2. **Dynamic Glow & Light Effects**
**Enhanced visual feedback:**
- **Red glow aura** surrounds the cabinet with `drop-shadow(0 0 30px rgba(192,21,42,0.4))`
- **Brightness increase** to 1.15x during hover for prominence
- **Shine layer** (semi-transparent radial gradient) creates a glossy reflection effect
- **Smooth transitions** using `cubic-bezier(0.34, 1.56, 0.64, 1)` for bouncy spring motion

### 3. **Enhanced Mouse Glow Trail**
**Improved cursor effect:**
- The fixed mouse glow element now has a more pronounced **red radial gradient**
- Added `drop-shadow` and `inset box-shadow` for depth
- Opacity and filter transitions make it feel more responsive to hover events

### 4. **Cabinet-Specific Light Reflection**
**Location:** Gallery items with `.shine-effect`

- Dynamically created shine layer using a radial gradient at the cursor position
- Creates a realistic **light reflection** as if light is bouncing off glass/aluminum
- Fades in/out smoothly with opacity transitions

---

## 🎨 CSS Enhancements

### Gallery Item Styling
```css
.gallery-item {
  /* 3D perspective and depth */
  perspective: 1200px;
  
  /* Glowing box shadow on hover */
  box-shadow: 
    0 0 40px rgba(192,21,42,0.6),
    0 20px 60px rgba(192,21,42,0.3),
    inset 0 0 20px rgba(255,255,255,0.1);
}

.gallery-item img {
  /* Preserve 3D transformations */
  transform-style: preserve-3d;
  transform-origin: center;
  
  /* High-quality animation frame rate */
  will-change: transform;
  
  /* Enhanced filtering */
  filter: brightness(1.1) saturate(1.2) drop-shadow(0 0 20px rgba(192,21,42,0.4));
}
```

### New Animations
Added two CSS keyframes:

**cabinetSpin:**
```css
@keyframes cabinetSpin {
  0%   { transform: perspective(1200px) rotateX(20deg) rotateY(0deg) rotateZ(8deg) scale(1.1); }
  100% { transform: perspective(1200px) rotateX(20deg) rotateY(360deg) rotateZ(8deg) scale(1.1); }
}
```

**glowPulse:**
```css
@keyframes glowPulse {
  0%, 100% { box-shadow: 0 0 20px rgba(192,21,42,0.5); }
  50%      { box-shadow: 0 0 40px rgba(192,21,42,0.8), 0 0 60px rgba(192,21,42,0.4); }
}
```

---

## 📜 JavaScript Implementation

### Section 6B: Advanced 3D Rotating Cabinet Effect

**Key Features:**

1. **Auto-Rotation on Hover:**
   - Uses `requestAnimationFrame` for smooth 60fps animation
   - Rotates continuously around the Y-axis
   - Can be interrupted by mouse movement

2. **Cursor-Tracking Rotation:**
   - Calculates mouse position relative to element center
   - Maps X/Y coordinates to rotation angles
   - `rotX` ranges from -30° to +30° (vertical tilt)
   - `rotY` ranges from -45° to +45° (horizontal rotation)
   - `rotZ` (twist) = mouseX / 100 for subtle tilt

3. **Performance Optimizations:**
   - Uses `will-change: transform` for GPU acceleration
   - Cancels RAF animation when switching to cursor tracking
   - Cleans up intervals on mouse leave
   - Transition timing: `0.08s ease-out` for smooth response

4. **Reset on Mouse Leave:**
   - Smooth transition back to original state (0.7s)
   - Uses `cubic-bezier(0.34, 1.56, 0.64, 1)` for bouncy spring effect
   - Removes glow and filter effects gracefully

### Section 6C: Interactive Light Shine Effect

```javascript
// Creates a shine layer dynamically
const shineLayer = document.createElement('div');
shineLayer.className = 'shine-effect';

// Positioned at the cabinet location with radial gradient
background: radial-gradient(circle at 50% 50%, rgba(255,255,255,0.3) 0%, transparent 70%);

// Toggles visibility on hover
item.addEventListener('mouseenter', () => {
  shineLayer.style.opacity = '0.6';
});
```

---

## 🚀 How to Use & Customize

### Adjust Rotation Intensity
In `script.js`, section 6B, modify these values:

```javascript
// For mouse tracking rotation
const rotX = mouseY * 30;  // Change 30 to increase/decrease vertical tilt
const rotY = mouseX * 45;  // Change 45 to increase/decrease horizontal rotation
const tiltZ = mouseX * 10; // Change 10 to adjust twist effect
```

### Change Auto-Rotation Speed
```javascript
autoRotateInterval = setInterval(() => {
  rotY += 3;  // Change 3 to speed up (higher) or slow down (lower)
  if (rotY > 360) rotY = 0;
  // ...
}, 16);
```

### Adjust Scale on Hover
```javascript
img.style.transform = `...scale(1.15)`  // Change 1.15 to adjust zoom level
```

### Customize Glow Color
In `style.css`, look for `rgba(192,21,42,...)` — this is your red color:
- `192,21,42` = RGB values for Redheart red
- Adjust opacity (last value) to make glow stronger/weaker

---

## 🎭 Animation Timing

| Effect | Duration | Easing | Note |
|--------|----------|--------|------|
| Rotation Response | 0.08s | ease-out | Snappy mouse tracking |
| Glow Transition | 0.3s | - | Smooth glow fade |
| Filter Change | 0.4s | - | Brightness/saturation |
| Reset Animation | 0.7s | cubic-bezier(0.34,1.56,0.64,1) | Bouncy spring back |
| Shine Effect | 0.3s | - | Reflection fade |

---

## 🔧 Browser Compatibility

These effects use modern CSS/JS features:
- **CSS 3D Transforms** - All modern browsers
- **Perspective & will-change** - Chrome 36+, Firefox 16+, Safari 9+, Edge 12+
- **RequestAnimationFrame** - All modern browsers
- **Drop-shadow filter** - All modern browsers (fallback to box-shadow)

**Note:** Effects gracefully degrade in older browsers (still functional, just without 3D).

---

## 💡 Performance Tips

1. **For slower devices:** Reduce the number of gallery items or increase RAF interval
2. **For mobile:** Consider simplifying effects or using media queries to disable on touch devices
3. **GPU Acceleration:** The `will-change: transform` and `transform-style: preserve-3d` ensure hardware acceleration

---

## 📱 Mobile Considerations

Currently, the 3D effects work with mouse movement. For touch devices:
- Hover states trigger on touch (mobile browsers simulate hover)
- Auto-rotation still works beautifully
- Swipe-based rotation could be added if needed

---

## 🎯 Next Steps

1. **Test across browsers** - Check Chrome, Firefox, Safari, Edge
2. **Adjust values** based on your preference for rotation intensity
3. **Add touch support** if you want swipe-to-rotate on mobile
4. **Monitor performance** - Use DevTools to check FPS
5. **Gather feedback** from users on the effect intensity

---

## 📚 Code Sections Modified

### script.js
- **Section 6B:** Advanced 3D Rotating Cabinet Effect (gallery items)
- **Section 6C:** Interactive Light Shine Effect on Cabinet Images

### style.css
- **Gallery Item Styling:** Enhanced with 3D transforms and glows
- **Animations Section:** Added `cabinetSpin` and `glowPulse` keyframes
- **Mouse Glow:** Improved radial gradient and shadow effects

### index.html
- No changes needed (uses existing `.gallery-item` structure)

---

## 🎬 Visual Effects Summary

✨ **Auto-rotating 3D cabinet** when you hover over images
✨ **Cursor-tracking rotation** following mouse movement
✨ **Dynamic red glow** with drop-shadow effects
✨ **Shine reflection** creating glass/aluminum gleam
✨ **Smooth spring animation** when returning to rest state
✨ **Enhanced mouse trail** with improved visibility

---

**Enjoy your premium 3D interactive cabinets! 🎉**
Your clients will love the modern, engaging experience.