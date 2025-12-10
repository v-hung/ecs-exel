import { useEffect, useState, type FC, type HTMLAttributes } from "react";
import { useNavigation } from "react-router";
import "./ProgressIndicator.css";

type State = HTMLAttributes<HTMLDivElement>;

const ProgressIndicator: FC<State> = (props) => {
  const { className = "", ...rest } = props;
  const { state } = useNavigation();

  const [progress, setProgress] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (state === "loading") {
      setIsAnimating(true);
      setProgress(70);
    } else {
      if (isAnimating) {
        setProgress(100);

        setTimeout(() => {
          setIsAnimating(false);
          setProgress(0);
        }, 200);
      }
    }
  }, [state]);

  return (
    <div {...rest} className={`progress-container ${className || ""}`}>
      <div
        className="progress-bar"
        style={{
          width: `${progress}%`,
          transition: isAnimating
            ? progress === 100
              ? "width 200ms ease-in-out"
              : "width 2s ease-in-out .5s"
            : "none",
        }}
      ></div>
    </div>
  );
};

export default ProgressIndicator;
