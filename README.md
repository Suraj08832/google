# Front Camera Application

A web application that captures photos from the front camera and stores them in a PostgreSQL database.

## Features

- Real-time front camera access
- Automatic photo capture every 5 seconds
- Secure storage in PostgreSQL database
- Mobile-friendly interface
- View captured photos

## Prerequisites

- Node.js (v14 or higher)
- PostgreSQL database
- Modern web browser with camera access

## Installation

1. Clone the repository:
```bash
git clone <your-repository-url>
cd frontcam
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env` file with the following variables:
```
DATABASE_URL=your_postgresql_connection_string
PORT=3000
```

4. Start the server:
```bash
node server.js
```

5. Open your browser and navigate to:
```
http://localhost:3000
```

## Usage

1. Grant camera permissions when prompted
2. The application will automatically capture photos every 5 seconds
3. View captured photos in the view page

## Deployment

The application can be deployed on platforms like Render.com with PostgreSQL add-on.

## License

MIT 