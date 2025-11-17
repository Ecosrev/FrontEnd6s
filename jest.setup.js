// jest.setup.js
import "@testing-library/jest-native/extend-expect";

// Configurações globais do Jest
global.__DEV__ = true;

// Mock do AsyncStorage
jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock")
);

// Mock de navegação
jest.mock("@react-navigation/native", () => {
  const actualNav = jest.requireActual("@react-navigation/native");
  return {
    ...actualNav,
    useNavigation: () => ({
      navigate: jest.fn(),
      goBack: jest.fn(),
      reset: jest.fn(),
      dispatch: jest.fn(),
    }),
    useRoute: () => ({
      params: {},
    }),
    useFocusEffect: jest.fn(),
  };
});

// Silenciar warnings específicos nos testes

beforeAll(() => {
  console.warn = (...args) => {
    const arg = args[0];
    if (
      typeof arg === "string" &&
      (arg.includes("Warning: ReactDOM.render") ||
        arg.includes("Not implemented: HTMLFormElement") ||
        arg.includes("Animated:"))
    ) {
      return;
    }
    originalWarn(...args);
  };

  console.error = (...args) => {
    const arg = args[0];
    if (
      typeof arg === "string" &&
      (arg.includes("Warning: An update to") || arg.includes("Not implemented"))
    ) {
      return;
    }
    originalError(...args);
  };
});

afterAll(() => {
  console.warn = originalWarn;
  console.error = originalError;
});

// Silenciar warnings específicos nos testes
const originalWarn = console.warn;
const originalError = console.error;

beforeAll(() => {
  console.warn = (...args) => {
    const arg = args[0];
    if (
      typeof arg === "string" &&
      (arg.includes("Warning: ReactDOM.render") ||
        arg.includes("Not implemented: HTMLFormElement"))
    ) {
      return;
    }
    originalWarn(...args);
  };

  console.error = (...args) => {
    const arg = args[0];
    if (typeof arg === "string" && arg.includes("Warning: An update to")) {
      return;
    }
    originalError(...args);
  };
});

afterAll(() => {
  console.warn = originalWarn;
  console.error = originalError;
});
