/**
 * Piko Challenges Hub
 * Browse and select from available challenges
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import challengeManifestService, { Challenge } from '../../services/challenge-manifest-service';
import '../../styles/hint-animations.css';

export function ChallengesHub() {
  const navigate = useNavigate();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    const loadChallenges = async () => {
      try {
        setLoading(true);
        const allChallenges = await challengeManifestService.getAllChallenges();
        setChallenges(allChallenges);
        console.log('✅ Loaded challenges:', allChallenges.length);
      } catch (err) {
        console.error('❌ Error loading challenges:', err);
        setError('Failed to load challenges');
      } finally {
        setLoading(false);
      }
    };

    loadChallenges();
  }, []);

  const categories = [...new Set(challenges.map(c => c.category))];
  const filteredChallenges = selectedCategory
    ? challenges.filter(c => c.category === selectedCategory)
    : challenges;

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy':
        return 'bg-green-100 text-green-800';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'Hard':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8 flex items-center justify-center">
        <div className="text-center">
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🐼</div>
          <div style={{ fontSize: '1.5rem', color: '#666' }}>Loading challenges...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8 flex items-center justify-center">
        <div className="text-center">
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>❌</div>
          <div style={{ fontSize: '1.2rem', color: '#c00' }}>{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🐼 Piko Challenges</div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Teach Piko & Build Your Skills!
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Choose a challenge and help Piko learn important life skills. 
            You'll be the teacher, and Piko will learn from your advice!
          </p>
        </div>

        {/* Category Filter */}
        {categories.length > 0 && (
          <div className="mb-8 flex flex-wrap gap-3 justify-center">
            <Button
              onClick={() => setSelectedCategory(null)}
              className={`rounded-full ${selectedCategory === null ? 'bg-indigo-600 text-white' : 'bg-white text-gray-900 border border-gray-200'}`}
            >
              All Categories
            </Button>
            {categories.map(category => (
              <Button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`rounded-full ${selectedCategory === category ? 'bg-indigo-600 text-white' : 'bg-white text-gray-900 border border-gray-200'}`}
              >
                {category}
              </Button>
            ))}
          </div>
        )}

        {/* Challenges Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredChallenges.map(challenge => (
            <Card
              key={challenge.id}
              className="hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden group"
              onClick={() => navigate(`/piko-challenge/${challenge.id}`)}
            >
              {/* Background gradient */}
              <div className="h-2 bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 group-hover:shadow-lg transition-all" />

              <CardHeader>
                <div className="flex items-start justify-between mb-2">
                  <Badge className={getDifficultyColor(challenge.difficulty)}>
                    {challenge.difficulty}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {challenge.todos.length} objectives
                  </Badge>
                </div>
                <CardTitle className="text-xl group-hover:text-indigo-600 transition-colors">
                  {challenge.title}
                </CardTitle>
                <CardDescription className="text-sm text-gray-600 mt-2">
                  {challenge.category}
                </CardDescription>
              </CardHeader>

              <CardContent>
                <p className="text-gray-700 text-sm leading-relaxed mb-4">
                  {challenge.description}
                </p>

                {/* Objectives preview */}
                <div className="mb-4">
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    Key Objectives:
                  </div>
                  <ul className="space-y-1">
                    {challenge.todos.slice(0, 3).map(todo => (
                      <li key={todo.id} className="text-xs text-gray-600 flex items-start gap-2">
                        <span className="text-indigo-500 font-bold mt-0.5">•</span>
                        <span>{todo.text}</span>
                      </li>
                    ))}
                    {challenge.todos.length > 3 && (
                      <li className="text-xs text-gray-500 italic">
                        +{challenge.todos.length - 3} more objectives
                      </li>
                    )}
                  </ul>
                </div>

                {/* Start Button */}
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/piko-challenge/${challenge.id}`);
                  }}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white group-hover:shadow-lg transition-all"
                >
                  Start Challenge
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredChallenges.length === 0 && (
          <div className="text-center py-12">
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🤔</div>
            <p className="text-gray-600">No challenges found in this category</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default ChallengesHub;
