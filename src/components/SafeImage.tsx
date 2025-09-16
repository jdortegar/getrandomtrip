// Bridge file so both import paths work:
// - '@/components/SafeImage'
// - '@/components/common/SafeImage' (canonical implementation)
export { default } from './common/SafeImage';
export * from './common/SafeImage';