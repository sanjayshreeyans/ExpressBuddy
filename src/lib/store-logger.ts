/**
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { create } from "zustand";
import { StreamingLog } from "../types";
import { mockLogs } from "../components/logger/mock-logs";

interface StoreLoggerState {
  maxLogs: number;
  logs: StreamingLog[];
  log: (streamingLog: StreamingLog) => void;
  clearLogs: () => void;
  clearModelResponses: () => void;
}

export const useLoggerStore = create<StoreLoggerState>((set, get) => ({
  maxLogs: 100,
  logs: [], //mockLogs,
  log: ({ date, type, message }: StreamingLog) => {
    set((state) => {
      // Clear previous model responses when a new model turn starts
      if (type === "server.content" && 
          typeof message === "object" && 
          message && 
          "serverContent" in message && 
          message.serverContent && 
          "modelTurn" in message.serverContent) {
        // Filter out previous model responses but keep user messages and other types
        const filteredLogs = state.logs.filter(log => {
          if (log.type === "server.content" && 
              typeof log.message === "object" && 
              log.message && 
              "serverContent" in log.message && 
              log.message.serverContent && 
              "modelTurn" in log.message.serverContent) {
            return false; // Remove previous model responses
          }
          return true; // Keep all other logs
        });
        
        return {
          logs: [
            ...filteredLogs.slice(-(get().maxLogs - 1)),
            {
              date,
              type,
              message,
            } as StreamingLog,
          ],
        };
      }

      const prevLog = state.logs.at(-1);
      if (prevLog && prevLog.type === type && prevLog.message === message) {
        return {
          logs: [
            ...state.logs.slice(0, -1),
            {
              date,
              type,
              message,
              count: prevLog.count ? prevLog.count + 1 : 1,
            } as StreamingLog,
          ],
        };
      }
      return {
        logs: [
          ...state.logs.slice(-(get().maxLogs - 1)),
          {
            date,
            type,
            message,
          } as StreamingLog,
        ],
      };
    });
  },

  clearLogs: () => {
    console.log("clear log");
    set({ logs: [] });
  },
  
  clearModelResponses: () => {
    set((state) => ({
      logs: state.logs.filter(log => {
        if (log.type === "server.content" && 
            typeof log.message === "object" && 
            log.message && 
            "serverContent" in log.message && 
            log.message.serverContent && 
            "modelTurn" in log.message.serverContent) {
          return false; // Remove model responses
        }
        return true; // Keep all other logs
      })
    }));
  },
  
  setMaxLogs: (n: number) => set({ maxLogs: n }),
}));
