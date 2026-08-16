import './Slider.scss';

function Slider({ images }) {
  return (
    <div className="slider">
      {images && images.length > 0 && (
        <img src={images[0]} alt="Property" />
      )}
    </div>
  );
}

export default Slider;
