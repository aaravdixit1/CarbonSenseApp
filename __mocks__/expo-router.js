// Mock for expo-router — only the parts used by IntakeContext
const useRouter = () => ({
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
});

module.exports = { useRouter };
