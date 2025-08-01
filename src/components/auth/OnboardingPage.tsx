import React, { useState } from 'react';
import { useUser } from '../../contexts/UserContext';
import { useNavigate } from 'react-router-dom';

export default function OnboardingPage() {
  const [name, setName] = useState('');
  const [age, setAge] = useState<number>(7);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { createChildProfile } = useUser();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }

    if (age < 5 || age > 12) {
      setError('Age must be between 5 and 12');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const child = await createChildProfile(name.trim(), age);
      if (child) {
        navigate('/dashboard');
      } else {
        setError('Failed to create profile. Please try again.');
      }
    } catch (err) {
      console.error('Error creating profile:', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Welcome to{' '}
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              ExpressBuddy
            </span>
          </h1>
          <p className="text-gray-600">
            Let's set up your learning profile!
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              What's your name?
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              placeholder="Enter your first name"
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="age" className="block text-sm font-medium text-gray-700 mb-2">
              How old are you?
            </label>
            <select
              id="age"
              value={age}
              onChange={(e) => setAge(parseInt(e.target.value))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              disabled={loading}
            >
              {[5, 6, 7, 8, 9, 10, 11, 12].map((ageOption) => (
                <option key={ageOption} value={ageOption}>
                  {ageOption} years old
                </option>
              ))}
            </select>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Setting up your profile...
              </div>
            ) : (
              'Start Learning!'
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
            <div className="h-1 w-8 bg-gradient-to-r from-blue-300 to-purple-300 rounded"></div>
            <span>Let's learn together!</span>
            <div className="h-1 w-8 bg-gradient-to-r from-blue-300 to-purple-300 rounded"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
