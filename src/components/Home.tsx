import React, { useState } from 'react';
import TweetComposer from './tweets/TweetComposer';
import TweetList from './tweets/TweetList';

const Home: React.FC = () => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleTweetCreated = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 min-h-screen">
      <TweetComposer onTweetCreated={handleTweetCreated} />
      <TweetList refreshTrigger={refreshTrigger} />
    </div>
  );
};

export default Home;