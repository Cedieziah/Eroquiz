import background from '@assets/background2.gif';

export default function AnimatedBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none z-[-1]">
      {/* Background image */}
      <div 
        className="absolute inset-0 w-full h-full"
        style={{
          backgroundImage: `url(${background})`,
          backgroundSize: 'cover',
          backgroundRepeat: 'repeat-x',
          backgroundPosition: 'center bottom',
          imageRendering: 'pixelated',
        }}
      ></div>
    </div>
  );
}