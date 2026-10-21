
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { SeoService } from './seo.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, FormsModule, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'SEO-Tool';
  websiteUrl = '';
  message = '';
  isError = false;
  analyzedUrl = '';

  pageTitle = '';
  metaDescription = '';
  titleStatus = '';
  descriptionStatus = '';

  descriptionLength = 0;
  titleLength = 0;

  seoScore = 0;
  passedChecks = 0;
  criticalIssues = 0;

  isHttps = false;
  hasHostname = false;
  hasRobotsMeta = false;
  hasViewportMeta = false;
  hasSitemapFile = false;
  hasCharsetDeclaration = false;
  hasLegacyCharset = '';
  hasModernCharset = '';
  canonicalUrl = '';

  totalImages = 0;
  imagesWithoutAlt = 0;
  imagesWithAlt = 0;
  brokenImageSources = 0;
  failedImageLoads = 0;

  isLoading = false;

  h1Count = 0;
  h2Count = 0;
  h3Count = 0;
  h4Count = 0;
  h5Count = 0;
  h6Count = 0;
  hasSingleH1 = false;

  activeSection = 'dashboard';

  constructor(private seoService: SeoService) {}

  AnalyzeWebsite(): void {
    // Clear the previous message and audit results first.
    this.message = '';
    this.isError = false;
    this.isLoading = false;
    this.analyzedUrl = '';

    this.pageTitle = '';
    this.metaDescription = '';
    this.titleStatus = '';
    this.descriptionStatus = '';
    this.titleLength = 0;
    this.descriptionLength = 0;

    this.seoScore = 0;
    this.passedChecks = 0;

    this.isHttps = false;
    this.hasHostname = false;
    this.hasRobotsMeta = false;
    this.hasViewportMeta = false;
    this.hasSitemapFile = false;
    this.hasCharsetDeclaration = false;
    this.hasLegacyCharset = '';
    this.hasModernCharset = '';
    this.canonicalUrl = '';

    this.totalImages = 0;
    this.imagesWithoutAlt = 0;
    this.imagesWithAlt = 0;
    this.brokenImageSources = 0;
    this.failedImageLoads = 0;

    this.h1Count = 0;
    this.h2Count = 0;
    this.h3Count = 0;
    this.h4Count = 0;
    this.h5Count = 0;
    this.h6Count = 0;
    this.hasSingleH1 = false;

    // Validate the entered URL.
    const url = this.websiteUrl.trim();

    if (!url) {
      this.message = 'Please enter a website URL.';
      this.isError = true;
      return;
    }

    let parsedUrl: URL;

    try {
      parsedUrl = new URL(url);

      if (
        parsedUrl.protocol !== 'http:' &&
        parsedUrl.protocol !== 'https:'
      ) {
        throw new Error('Invalid protocol');
      }

      if (!parsedUrl.hostname) {
        throw new Error('Missing hostname');
      }
    } catch {
      this.message =
        'Please enter a valid website URL, such as https://example.com';
      this.isError = true;
      return;
    }

    // Set details for the new URL.
    this.analyzedUrl = parsedUrl.href;
    this.isHttps = parsedUrl.protocol === 'https:';
    this.hasHostname = !!parsedUrl.hostname;

    this.message = 'Analyzing website...';
    this.isLoading = true;

    this.seoService.analyzeWebsite(this.analyzedUrl).subscribe({
      next: (data) => {
        // Read data returned by the backend.
        this.criticalIssues = 0;
        if (!data.title) {
          this.criticalIssues++;
        }
        if (!data.description) {
          this.criticalIssues++;
        }

        this.pageTitle = data.title ?? '';
        this.titleLength = this.pageTitle.length;

        this.metaDescription = data.description ?? '';
        this.descriptionLength = this.metaDescription.length;

        this.h1Count = data.headings?.h1 ?? 0;
        this.h2Count = data.headings?.h2 ?? 0;
        this.h3Count = data.headings?.h3 ?? 0;
        this.h4Count = data.headings?.h4 ?? 0;
        this.h5Count = data.headings?.h5 ?? 0;
        this.h6Count = data.headings?.h6 ?? 0;

        this.hasSingleH1 = this.h1Count === 1;

        this.hasRobotsMeta = !!data.robots;
        this.hasViewportMeta = data.hasViewportMeta ?? false;
        this.hasSitemapFile = data.hasSitemapFile ?? false;
        this.canonicalUrl = data.canonicalUrl ?? '';

        this.hasModernCharset = data.hasModernCharset ?? '';
        this.hasLegacyCharset = data.hasLegacyCharset ?? '';
        this.hasCharsetDeclaration =
          data.hasCharsetDeclaration ?? false;

        this.totalImages = data.totalImages ?? 0;
        this.imagesWithoutAlt = data.imagesWithoutAlt ?? 0;

        this.imagesWithAlt = Math.max(
          0,
          this.totalImages - this.imagesWithoutAlt
        );

        this.brokenImageSources = data.brokenImageSources ?? 0;
        this.failedImageLoads = data.failedImageLoads ?? 0;

        // Check title length.
        this.titleStatus =
          this.titleLength === 0
            ? 'Missing title'
            : this.titleLength < 30
              ? 'Title may be too short'
              : this.titleLength > 60
                ? 'Title may be too long'
                : 'Title length looks good';

        // Check meta description length.
        this.descriptionStatus =
          this.descriptionLength === 0
            ? 'Missing meta description'
            : this.descriptionLength < 120
              ? 'Description may be too short'
              : this.descriptionLength > 160
                ? 'Description may be too long'
                : 'Description length looks good';

        // Calculate passed checks (7 checks).
        this.passedChecks = 0;

        if (this.titleStatus === 'Title length looks good') {
          this.passedChecks++;
        }

        if (
          this.descriptionStatus === 'Description length looks good'
        ) {
          this.passedChecks++;
        }

        if (this.isHttps) {
          this.passedChecks++;
        }

        if (this.canonicalUrl) {
          this.passedChecks++;
        }

        if (this.hasRobotsMeta) {
          this.passedChecks++;
        }

        if (this.hasViewportMeta) {
          this.passedChecks++;
        }

        if (this.hasSitemapFile) {
          this.passedChecks++;
        }

        this.seoScore = Math.round(
          (this.passedChecks / 7) * 100
        );

        this.isLoading = false;
        this.message = 'SEO analysis completed successfully.';
        this.isError = false;

        console.log('Real SEO data:', data);
      },

      error: (error: HttpErrorResponse) => {
        console.error('SEO Analysis failed:', error);

        this.isLoading = false;
        this.message =
          'Unable to fetch website metadata. Please try another URL.';
        this.isError = true;
      }
    });
  }

  getScoreLabel(): string {
    if (this.seoScore >= 80) {
      return 'Good SEO health';
    }

    if (this.seoScore >= 50) {
      return 'Needs improvement';
    }

    return 'Needs attention';
  }

  navigateTo(section: string): void {
    this.activeSection = section;
  }
}

