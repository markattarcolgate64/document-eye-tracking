declare module "webgazer" {
  interface WebGazer {
    params: {
      showVideoPreview: boolean;
      showFaceOverlay: boolean;
      showFaceFeedbackBox: boolean;
    };
    setRegression(type: string): WebGazer;
    setGazeListener(
      listener: (data: { x: number; y: number } | null, elapsedTime: number) => void
    ): WebGazer;
    begin(): Promise<WebGazer>;
    end(): void;
    pause(): void;
    resume(): void;
    showVideoPreview(show: boolean): WebGazer;
    showPredictionPoints(show: boolean): WebGazer;
    clearData(): void;
  }

  const webgazer: WebGazer;
  export default webgazer;
}
