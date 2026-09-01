'use client';
import { redirect } from 'next/navigation';

export default function EmptyScreen() {
  redirect('/screens/home');
}
