import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const SupabaseTest: React.FC = () => {
  const [connectionStatus, setConnectionStatus] = useState<string>('checking...');
  const [tables, setTables] = useState<any[]>([]);

  useEffect(() => {
    const testConnection = async () => {
      try {
        // Test basic connection by trying to query the lessons table
        const { data, error } = await supabase
          .from('lessons')
          .select('id, title')
          .limit(5);

        if (error) {
          console.error('Connection error:', error);
          setConnectionStatus('❌ Connection failed');
        } else {
          setConnectionStatus('✅ Connected successfully');
          setTables(data || []);
        }
      } catch (err) {
        console.error('Connection test failed:', err);
        setConnectionStatus('❌ Connection failed');
      }
    };

    testConnection();
  }, []);

  return (
    <div style={{ padding: '20px', border: '1px solid #ddd', margin: '10px', borderRadius: '5px' }}>
      <h3>Supabase Connection Test</h3>
      <p>Status: {connectionStatus}</p>
      {tables.length > 0 && (
        <div>
          <h4>Available Lessons:</h4>
          <ul>
            {tables.map((lesson: any, index: number) => (
              <li key={index}>{lesson.title || lesson.id}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default SupabaseTest;
