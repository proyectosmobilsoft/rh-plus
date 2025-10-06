
import React, { useRef, useEffect } from 'react';
import SignaturePad from 'signature_pad';

interface SignatureCanvasProps {
  onSignatureChange: (signatureData: string) => void;
  initialSignature?: string | null;
}

const SignatureCanvas: React.FC<SignatureCanvasProps> = ({ onSignatureChange, initialSignature }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const signaturePadRef = useRef<SignaturePad | null>(null);

  useEffect(() => {
    if (canvasRef.current) {
      // Fix canvas scaling to solve pointer alignment issue
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      // Set canvas dimensions based on the displayed size
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      
      // Scale the context to match the pixel ratio
      const pixelRatio = window.devicePixelRatio || 1;
      if (context) {
        context.scale(pixelRatio, pixelRatio);
      }
      
      // Initialize signature pad after proper scaling
      signaturePadRef.current = new SignaturePad(canvas, {
        backgroundColor: 'rgba(255, 255, 255, 0)',
        penColor: 'black',
        minWidth: 0.5,
        maxWidth: 2.5,
      });

      // Load initial signature if provided
      if (initialSignature) {
        signaturePadRef.current.fromDataURL(initialSignature);
      }

      // Set signature change handler
      signaturePadRef.current.addEventListener('endStroke', () => {
        if (signaturePadRef.current) {
          const data = signaturePadRef.current.toDataURL('image/png');
          onSignatureChange(data);
        }
      });
    }

    // Resize handler to maintain proper scaling
    const handleResize = () => {
      if (canvasRef.current && signaturePadRef.current) {
        const canvas = canvasRef.current;
        const data = signaturePadRef.current.toDataURL();
        
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;
        
        // Re-initialize the signature pad
        signaturePadRef.current.clear();
        if (data && data !== 'data:,') {
          signaturePadRef.current.fromDataURL(data);
        }
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (signaturePadRef.current) {
        signaturePadRef.current.off();
        signaturePadRef.current = null;
      }
    };
  }, [onSignatureChange, initialSignature]);

  const clearSignature = () => {
    if (signaturePadRef.current) {
      signaturePadRef.current.clear();
      onSignatureChange('');
    }
  };

  return (
    <div className="flex flex-col items-center">
      <div className="border border-gray-300 rounded-md w-full bg-white">
        <canvas
          ref={canvasRef}
          className="w-full h-36"
        />
      </div>
      <div className="flex justify-end w-full mt-2">
        <button
          type="button"
          className="text-sm text-gray-600 hover:text-gray-800"
          onClick={clearSignature}
        >
          Limpiar firma
        </button>
      </div>
    </div>
  );
};

export default SignatureCanvas;

