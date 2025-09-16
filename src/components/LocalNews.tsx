import React, { useState, useEffect } from 'react';
import './LocalNews.css';

interface NewsItem {
  id: string;
  headline: string;
  source: string;
}

const LocalNews: React.FC = () => {
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLocalNews = async () => {
    try {
      // This would typically be an API call to fetch real news
      // For now, simulating with static data
      const mockNewsData: NewsItem[] = [
        {
          id: '1',
          headline: 'Schlitterbahn New Braunfels Announces Winter Festival Plans',
          source: 'New Braunfels Herald-Zeitung'
        },
        {
          id: '2',
          headline: 'Gruene Hall Celebrates Historic Music Series',
          source: 'New Braunfels Chamber'
        },
        {
          id: '3',
          headline: 'New Braunfels ISD Receives Excellence in Education Award',
          source: 'NBISD News'
        }
      ];
      setNewsItems(mockNewsData);
    } catch (error) {
      console.error('Error fetching local news:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocalNews();
    // Refresh news every 5 minutes
    const interval = setInterval(fetchLocalNews, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading && newsItems.length === 0) {
    return <div className="news-loading">Loading news...</div>;
  }

  return (
    <div className="local-news">
      {newsItems.map((item) => (
        <div key={item.id} className="news-item">
          <div className="news-headline">{item.headline}</div>
          <div className="news-source">{item.source}</div>
        </div>
      ))}
    </div>
  );
};

export default LocalNews;