import boxingAction from "@/assets/landing/boxing-action.jpg";
import mmaTraining from "@/assets/landing/mma-training.jpg";
import muaythaiKick from "@/assets/landing/muaythai-kick.jpg";

const PhotoGrid = () => {
  const photos = [
    { src: boxingAction, alt: "Professional boxer throwing a punch during training - Combat Market boxing gear" },
    { src: mmaTraining, alt: "MMA fighter training in the cage - Combat Market mixed martial arts equipment" },
    { src: muaythaiKick, alt: "Muay Thai fighter executing a powerful kick - Combat Market combat sports gear" },
  ];

  return (
    <section className="border-t border-border py-8 sm:py-16" aria-label="Combat sports action photos">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-3">
          {photos.map((photo, index) => (
            <div
              key={index}
              className="group relative aspect-[4/3] overflow-hidden rounded-lg"
            >
              <img
                src={photo.src}
                alt={photo.alt}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PhotoGrid;
