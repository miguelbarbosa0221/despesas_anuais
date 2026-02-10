# **App Name**: Anualize

## Core Features:

- Expense Tracking: Tracks user's expenses on a monthly and annual basis, linked to user account in Firestore.
- Data Visualization: Displays expenses in a tabular format, highlighting the current month and providing annual totals.
- Expense Management: Allows users to add, edit, and delete expenses, with real-time updates via Firestore.
- Archiving Expenses: Allows user to archive an expense if they do not want it included in calculations, or permanently remove the entry.
- Data Persistence: Save selected year to localStorage to manage reload errors with Nextjs
- Next Year Generator: Upon confirmation, copy active (non-archived) expenses into the next year, initializing values to zero, using a Firestore batch write operation.
- AI-Powered Anomaly Detection: Generative AI tool which provides tips and advice by learning users financial patterns. Anomaly detection is the main tool here and should inform output.

## Style Guidelines:

- Primary color: Sky blue (#87CEEB) for a calm and trustworthy feel.
- Background color: Light gray (#F0F8FF) to ensure a clean, neutral backdrop.
- Accent color: Soft orange (#FFB347) for interactive elements and highlights.
- Body and headline font: 'Inter' sans-serif for a modern, neutral look that will be useful across platforms.
- Note: currently only Google Fonts are supported.
- Use Lucide React icons for a consistent and clean visual language.
- Employ a responsive layout using Tailwind CSS, ensuring adaptability across various devices.
- Subtle transitions and animations for a smooth user experience when interacting with data.