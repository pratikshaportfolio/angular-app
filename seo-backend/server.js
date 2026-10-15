
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
const PORT = 3000;

app.use(cors({
    origin: 'http://localhost:4200',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type']
  }));

app.use(express.json());

app.get('/', (req, res) => {
  res.send('SEO Lens backend is running!');
});

app.post('/api/analyze', async (req, res) => {
  try {
    const { url } = req.body;

    if (!url || typeof url !== 'string') {
      return res.status(400).json({
        error: 'Please provide a website URL.'
      });
    }

    const parsedUrl = new URL(url);

    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return res.status(400).json({
        error: 'Only HTTP and HTTPS URLs are allowed.'
      });
    }

    const response = await axios.get(parsedUrl.href, {
      timeout: 10000,
      maxRedirects: 0,
      responseType: 'text',
      maxContentLength: 2 * 1024 * 1024,
      headers: {
        'User-Agent': 'SEOLens/1.0'
      }
    });

    const contentType = response.headers['content-type'] || '';

    if (!contentType.includes('text/html')) {
      return res.status(400).json({
        error: 'The URL did not return an HTML page.'
      });
    }

    const $ = cheerio.load(response.data);

    const title = $('title').first().text().trim();
    const description = $('meta[name="description"]')
      .attr('content')?.trim() || '';
      
    const robots = $('meta[name="robots"]')
      .attr('content')?.trim() || '';

    const hasViewportMeta = $('meta[name="viewport"]').length > 0;

    const sitemapUrl = new URL('/sitemap.xml', url).href;
    let hasSitemapFile = false;
    try {
    const sitemapResponse = await axios.get(sitemapUrl, {
    timeout: 5000
    });
    const sitemapText = String(sitemapResponse.data);

hasSitemapFile =
  sitemapResponse.status === 200 &&
  /<\s*(urlset|sitemapindex)\b/i.test(sitemapText);
  } catch {
    hasSitemapFile = false;
    }

    const hasCharsetDeclaration =
    $('meta[charset="UTF-8"]').length > 0 ||
    $('meta[charset="utf-8"]').length > 0;

    // const hasModernCharset = $('meta[charset]').filter(function(){
    //     return $(this).attr('charset').toLowerCase() === 'utf-8';
    // }).length > 0;

    // const hasLegacyCharset = $('meta[http-equiv="Content-Type"]').filter(function(){
    //     const content = $(this).attr('content') || '';
    //     return content.toLowerCase().includes('charset=utf-8');
    // }).length > 0;

    // const hasCharsetDeclaration = hasModernCharset || hasLegacyCharset;

    const canonicalUrl = $('link[rel="canonical"]').attr('href')?.trim() || '';

    const totalImages = $('img').length;

    const imagesWithoutAlt = $('img').filter((_, image) => {
    return !$(image).attr('alt')?.trim();
    }).length;

    const brokenImageSources = $('img').filter((_, image) =>{
        return !$(image).attr('src')?.trim();
    }).length;

    const imageSources = $('img')
    .map((_, image) => $(image).attr('src'))
    .get()
    .filter(src => src && src.trim());
    
    const absoluteImageSources = imageSources.map(src => {
        try {
        return new URL(src, parsedUrl.href).href;
        } catch {
        return null;
        }
    }).filter(Boolean);

    
    const imageSourcesToCheck = [
        ...new Set(absoluteImageSources)
    ]
        .filter(src => {
        const protocol = new URL(src).protocol;
        return protocol === 'http:' || protocol === 'https:';
        })
        .slice(0, 10);

    
    const imageLoadResults = await Promise.all(
        imageSourcesToCheck.map(async (imageUrl) => {
        try {
            const response = await axios.get(imageUrl, {
            timeout: 5000,
            maxRedirects: 3,
            responseType: 'stream',
            maxContentLength: 2 * 1024 * 1024,
            headers: { 'User-Agent': 'SEOLens/1.0' }
            });
    
            const contentType = response.headers['content-type'] || '';
            response.data.destroy();
    
            return {
            url: imageUrl,
            loaded: response.status >= 200 &&
                    response.status < 300 &&
                    contentType.startsWith('image/')
            };
        } catch {
            return { url: imageUrl, loaded: false };
        }
        })
    );
    
    const failedImageLoads = imageLoadResults.filter(
        result => !result.loaded
    ).length;
    

    const headings = {
      h1: $('h1').length,
      h2: $('h2').length,
      h3: $('h3').length
    };

    res.json({
      url: parsedUrl.href,
      title,
      description,
      robots,
      headings,
      hasViewportMeta,
      hasCharsetDeclaration,
      hasSitemapFile,
      canonicalUrl,
      totalImages,
      imagesWithoutAlt,
      brokenImageSources,
      imageSources,
      absoluteImageSources,
      imageSourcesToCheck,
      imageLoadResults,
      failedImageLoads
    });

  } catch (error) {
    console.error('SEO analysis error:', error.message);
    console.error('Error code:', error.code);
    console.error('HTTP status:', error.response?.status);
    res.status(400).json({
      error: 'Unable to analyze this webpage. Check the URL and try again.'
    });
  }
});

app.listen(PORT, () => {
  console.log(`SEO Lens backend running at http://localhost:${PORT}`);
});
