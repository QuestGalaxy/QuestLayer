# Add Theme Templates to Test Embed Page

I will update the `test-embed.html` mockup page to allow switching between the various visual templates (themes) defined in your project.

## 1. UI Updates in `test-embed.html`
*   **Add "Theme" Section**: I'll create a new control section below "Widget Position" specifically for themes.
*   **Theme Buttons**: I'll add buttons for all available themes found in your code:
    *   `Sleek` (Default)
    *   `Cyber`
    *   `Minimal`
    *   `Gaming`
    *   `Brutal`
    *   `Glass`
    *   `Terminal`
    *   `Aura`
    *   `Avatar`
    *   `Ironman`

## 2. Logic Updates
*   **URL Parameter**: I will add logic to handle a `?theme=` URL parameter, similar to how `?pos=` works.
*   **Widget Config**: I will update the widget initialization script to read this theme parameter and pass it to the widget as `activeTheme`.

## 3. Verification
*   You will be able to click any theme button to instantly reload the page and see the widget render in that specific style.
