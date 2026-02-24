# PDF Compressor

A modern, easy-to-use PDF compression tool built with Next.js and deployable on Vercel.

## Features

- 📄 Upload and compress PDF files
- 🚀 Fast compression using pdf-lib
- 📊 Shows compression statistics
- 💾 Automatic download of compressed files
- 🎨 Beautiful, responsive UI
- ☁️ Deployable on Vercel

## Getting Started

### Local Development

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Deploy to Vercel

#### Option 1: Deploy with Vercel CLI

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Login to Vercel:
```bash
vercel login
```

3. Deploy:
```bash
vercel
```

4. Follow the prompts to complete the deployment.

#### Option 2: Deploy via Vercel Dashboard

1. Push your code to a Git repository (GitHub, GitLab, or Bitbucket)

2. Go to [vercel.com](https://vercel.com) and sign in

3. Click "Add New Project"

4. Import your repository

5. Vercel will automatically detect Next.js and configure the build settings

6. Click "Deploy"

That's it! Your PDF compressor will be live in a few minutes.

## How to Use

1. Visit your deployed application
2. Click on the upload area or drag and drop a PDF file
3. Click "Compress PDF"
4. The compressed file will automatically download
5. View the compression statistics

## Tech Stack

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe JavaScript
- **pdf-lib** - PDF manipulation library
- **Vercel** - Hosting and deployment platform

## Configuration

The application is configured to handle PDFs up to 50MB. You can adjust this in `next.config.js`:

```javascript
api: {
  bodyParser: {
    sizeLimit: '50mb',
  },
}
```

## License

MIT

## Notes

- The compression works by removing metadata, optimizing object streams, and compressing the PDF structure
- All processing happens on the server for security
- Files are not stored permanently - they're processed and immediately returned
