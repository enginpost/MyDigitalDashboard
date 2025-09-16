import React, { useState, useEffect } from 'react';
import './NationalNews.css';

interface NewsItem {
  id: string;
  headline: string;
  source: string;
}

const NationalNews: React.FC = () => {
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNationalNews = async () => {
    try {
      // This would typically be an API call to fetch real news
      // For now, simulating with static data
      const mockNewsData: NewsItem[] = [
        {
          id: '1',
          headline: 'NASA Announces New Mars Mission Launch Date',
          source: 'Associated Press'
        },
        {
          id: '2',
          headline: 'Federal Reserve Reviews Economic Growth Projections',
          source: 'Reuters'
        },
        {
          id: '3',
          headline: 'Major Infrastructure Bill Passes Through Congress',
          source: 'Washington Post'
        }
      ];
      setNewsItems(mockNewsData);
    } catch (error) {
      console.error('Error fetching national news:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNationalNews();
    // Refresh news every 5 minutes
    const interval = setInterval(fetchNationalNews, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading && newsItems.length === 0) {
    return <div className="news-loading">Loading news...</div>;
  }

  return (
    <div className="national-news">
      {newsItems.map((item) => (
        <div key={item.id} className="news-item">
          <div className="news-headline">{item.headline}</div>
          <div className="news-source">{item.source}</div>
        </div>
      ))}
    </div>
  );
};

export default NationalNews;