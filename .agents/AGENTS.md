# Rules

- Whenever the user says "bana anahtarı ver" (or variations like "anahtarı ver"), the agent MUST immediately output the following PowerShell command block to reveal the project folder and start the Expo server:
  ```powershell
  explorer . ; npx expo start
  ```
