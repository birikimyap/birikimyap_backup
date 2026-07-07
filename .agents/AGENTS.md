# Rules

- Whenever the user says "bana anahtarı ver" (or variations like "anahtarı ver"), the agent MUST immediately output the following PowerShell command block to navigate to the project directory, reveal the folder, and start the Expo server:
  ```powershell
  cd C:\projeler\birikim_yap ; explorer . ; npx expo start
  ```
