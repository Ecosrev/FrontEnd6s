// __tests__/Header.test.js
import React from "react";
import { render } from "@testing-library/react-native";
import Header from "../src/components/AppHeader";

// Mock do useTheme
jest.mock("../src/contexts/ThemeContext", () => ({
  useTheme: jest.fn(() => ({
    colors: {
      background: "#FFFFFF",
      shadow: "#000000",
      statusbar: "#1E88E5",
      text: {
        primary: "#000000",
        secondary: "#666666",
      },
    },
    statusBarStyle: "dark-content",
  })),
}));

// Mock do componente Animation
jest.mock("../src/components/Animation", () => {
  return function MockAnimation() {
    const { View, Text } = require("react-native");
    return (
      <View testID="mock-animation">
        <Text>Animation Mock</Text>
      </View>
    );
  };
});

// Mock do SafeAreaView
jest.mock("react-native-safe-area-context", () => {
  const { View } = require("react-native");
  return {
    SafeAreaView: ({ children, ...props }) => (
      <View {...props}>{children}</View>
    ),
  };
});

describe("Header Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("deve renderizar corretamente", () => {
    const { getByText } = render(<Header />);
    expect(getByText("EcosRev")).toBeTruthy();
  });

  it('deve renderizar o texto "EcosRev"', () => {
    const { getByText } = render(<Header />);
    const headerText = getByText("EcosRev");
    expect(headerText).toBeTruthy();
  });

  it("deve renderizar o componente Animation", () => {
    const { getByTestId } = render(<Header />);
    expect(getByTestId("mock-animation")).toBeTruthy();
  });

  it("deve aplicar as cores do tema corretamente", () => {
    const { useTheme } = require("../src/contexts/ThemeContext");
    const { getByText } = render(<Header />);

    expect(useTheme).toHaveBeenCalled();

    const headerText = getByText("EcosRev");
    expect(headerText.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          color: "#000000",
        }),
      ])
    );
  });

  it("deve ter o texto com fontSize 24 e fontWeight bold", () => {
    const { getByText } = render(<Header />);
    const headerText = getByText("EcosRev");

    expect(headerText.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          fontSize: 24,
          fontWeight: "bold",
        }),
      ])
    );
  });
});
