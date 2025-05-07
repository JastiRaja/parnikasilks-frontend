const getImageUrl = (imageId: string): string => {
  if (!imageId || imageId === 'null' || imageId === null || imageId === undefined || imageId === '') {
    return '/images/Placeholder.png';
  }
  return `${BACKEND_URL}/api/admin/images/${imageId}`;
};

<div className="flex-shrink-0">
  {item.product.images && item.product.images.length > 0 ? (
    <img
      src={getImageUrl(item.product.images[0])}
      alt={item.product.name}
      className="h-24 w-24 rounded-md object-cover object-center sm:h-32 sm:w-32"
      onError={(e) => {
        e.currentTarget.src = '/images/Placeholder.png';
      }}
    />
  ) : (
    <div className="h-24 w-24 rounded-md bg-gray-100 flex items-center justify-center sm:h-32 sm:w-32">
      <span className="text-gray-400 text-sm">No image</span>
    </div>
  )}
</div> 