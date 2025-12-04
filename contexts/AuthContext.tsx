import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { Retailer } from '@/types/database';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  retailer: Retailer | null;
  loading: boolean;
  signIn: (phone: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (data: {
    name: string;
    phone: string;
    password: string;
    shopName: string;
    location: string;
  }) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshRetailer: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  retailer: null,
  loading: true,
  signIn: async () => ({ error: null }),
  signUp: async () => ({ error: null }),
  signOut: async () => {},
  refreshRetailer: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [retailer, setRetailer] = useState<Retailer | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        loadRetailer(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        loadRetailer(session.user.id);
      } else {
        setRetailer(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadRetailer = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('retailers')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) throw error;
      setRetailer(data);
    } catch (error) {
      console.error('Error loading retailer:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshRetailer = async () => {
    if (user) {
      await loadRetailer(user.id);
    }
  };

  const signIn = async (phone: string, password: string) => {
    try {
      const email = `${phone}@flowerretail.app`;
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signUp = async (data: {
    name: string;
    phone: string;
    password: string;
    shopName: string;
    location: string;
  }) => {
    try {
      const email = `${data.phone}@flowerretail.app`;
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password: data.password,
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('User creation failed');

      const { error: retailerError } = await supabase.from('retailers').insert({
        id: authData.user.id,
        phone: data.phone,
        name: data.name,
        shop_name: data.shopName,
        location: data.location,
      });

      if (retailerError) throw retailerError;

      const defaultFlowers = ['Jasmine', 'Rose', 'Marigold', 'Others'];
      const { error: flowersError } = await supabase.from('flower_types').insert(
        defaultFlowers.map((name) => ({
          retailer_id: authData.user!.id,
          name,
          is_active: true,
        }))
      );

      if (flowersError) throw flowersError;

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setRetailer(null);
  };

  const value = {
    session,
    user,
    retailer,
    loading,
    signIn,
    signUp,
    signOut,
    refreshRetailer,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
