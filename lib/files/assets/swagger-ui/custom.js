setTimeout(() => {
  RBAC();
  search();
  navSidebar();

  // Make the Schema section close by default
  document.querySelector('.models-control').click();
}, 10);

function search() {
  // Select the existing container
  const searchContainer = document.querySelector('.filter.wrapper.block.col-12');

  if (searchContainer) {
    // Create the input
    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.id = 'swaggerSearch';
    searchInput.placeholder = 'Search endpoints...';
    searchInput.classList.add('operation-filter-input');

    // Append input to the container
    searchContainer.appendChild(searchInput);

    // Add functionality
    searchInput.addEventListener('input', e => {
      const searchTerm = e.target.value.toLowerCase();
      document.querySelectorAll('.opblock').forEach(opblock => {
        const text = opblock.textContent.toLowerCase();
        opblock.style.display = text.split(' ')[0].includes(searchTerm) ? '' : 'none';
      });
    });
  }
}

function RBAC() {
  document.querySelectorAll('.opblock-summary').forEach(el => {
    // Match patterns like "[RBAC:PERMISSION]" or "[RBAC]"
    let match = el.innerText.match(/\[RBAC(?::([^\]]+))?\]/);

    if (match) {
      let permission = match[1] ? match[1].trim() : 'RBAC Protected';

      let svgIcon = document.createElement('span');
      svgIcon.innerHTML = `
                <svg width="20px" height="20px" style="margin-top: 2px;" viewBox="0 0 1920 1920" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1600 1066.667c117.653 0 213.333 95.68 213.333 213.333v106.667H1920V1760c0 88.213-71.787 160-160 160h-320c-88.213 0-160-71.787-160-160v-373.333h106.667V1280c0-117.653 95.68-213.333 213.333-213.333ZM800 0c90.667 0 179.2 25.6 254.933 73.6 29.867 18.133 58.667 40.533 84.267 66.133 49.067 49.067 84.8 106.88 108.053 169.814 11.307 30.4 20.8 61.44 25.814 94.08l2.24 14.613 3.626 20.16-.533.320v.213l-52.693 32.427c-44.694 28.907-95.467 61.547-193.067 61.867-.427 0-.747.106-1.173.106-24.534 0-46.08-2.133-65.28-5.653-.64-.107-1.067-.32-1.707-.427-56.32-10.773-93.013-34.24-126.293-55.68-9.6-6.293-18.774-12.16-28.16-17.6-27.947-16-57.92-27.306-108.16-27.306h-.32c-57.814.106-88.747 15.893-121.387 36.266-4.48 2.88-8.853 5.44-13.44 8.427-3.093 2.027-6.72 4.16-9.92 6.187-6.293 4.053-12.693 8.106-19.627 12.16-4.48 2.666-9.493 5.013-14.293 7.573-6.933 3.627-13.973 7.147-21.76 10.453-6.613 2.987-13.76 5.547-21.12 8.107-6.933 2.347-14.507 4.267-22.187 6.293-8.96 2.347-17.813 4.587-27.84 6.187-1.173.213-2.133.533-3.306.747v57.6c0 17.066 1.066 34.133 4.266 50.133C454.4 819.2 611.2 960 800 960c195.2 0 356.267-151.467 371.2-342.4 48-14.933 82.133-37.333 108.8-54.4v23.467c0 165.546-84.373 311.786-212.373 398.08h4.906a1641.19 1641.19 0 0 1 294.08 77.76C1313.28 1119.68 1280 1195.733 1280 1280h-106.667v480c0 1.387.427 2.667.427 4.16-142.933 37.547-272.427 49.173-373.76 49.173-345.493 0-612.053-120.32-774.827-221.333L0 1576.32v-196.373c0-140.054 85.867-263.04 218.667-313.28 100.373-38.08 204.586-64.96 310.186-82.347h4.8C419.52 907.413 339.2 783.787 323.2 640c-2.133-17.067-3.2-35.2-3.2-53.333V480c0-56.533 9.6-109.867 27.733-160C413.867 133.333 592 0 800 0Zm800 1173.333c-58.773 0-106.667 47.894-106.667 106.667v106.667h213.334V1280c0-58.773-47.894-106.667-106.667-106.667Z" fill="#8D9297"/>
                </svg>
                <span class="custom-tooltip">Permission: ${permission}</span>
            `;

      svgIcon.style.paddingLeft = '10px';
      svgIcon.style.marginTop = '2px';
      svgIcon.className = 'rbac-tooltip'; // Add custom class
      // svgIcon.title = `Permission: ${permission}`;

      let button = el.querySelector('.authorization__btn');

      if (button) {
        button.parentNode.insertBefore(svgIcon, button);
      }

      // Get the text content and remove the [RBAC:...] - part
      const originalText = el.innerText.split('\n')[2];
      const cleanedText = originalText.replace(/\[.*?\]\s*-\s*/, '').trim();

      // Update the text content in the UI
      const textElements = el.querySelectorAll('span, div, p');

      textElements[4].textContent = cleanedText;
    }
  });
}
function navSidebar() {
  // Create the sidebar container
  const navSidebar = document.createElement('div');
  navSidebar.id = 'swagger-quick-nav';
  navSidebar.classList.add('collapsed'); // start collapsed

  // Create the toggle button
  const toggleBtn = document.createElement('button');
  toggleBtn.id = 'swagger-quick-nav-toggle';
  toggleBtn.innerHTML = '&#9776; Quick Nav';
  toggleBtn.addEventListener('click', () => {
    navSidebar.classList.toggle('collapsed');
  });

  document.querySelector('.topbar').appendChild(toggleBtn);

  navSidebar.innerHTML = `<h3>Quick Navigation</h3>`;

  // Loop through Swagger tags
  document.querySelectorAll('.opblock-tag').forEach(tag => {
    const tagName = tag.textContent.trim();
    const tagSection = document.createElement('div');
    tagSection.className = 'swagger-nav-section';
    tagSection.innerHTML = `<h4>${tagName}</h4>`;

    const operations = tag.nextElementSibling.querySelectorAll('.opblock');
    operations.forEach(opblock => {
      const path = opblock.querySelector('.opblock-summary-path')?.textContent.trim();
      const method = opblock.querySelector('.opblock-summary-method')?.textContent.trim();

      if (!path || !method) return;

      const link = document.createElement('a');
      link.href = `#/${opblock.id.split('-')[1]}/${opblock.id.split('-')[2]}`;
      link.className = `swagger-nav-link method-${method.toLowerCase()}`;
      link.innerHTML = `<code>${method}</code> ${path}`;

      link.addEventListener('click', e => {
        e.preventDefault();
        opblock.scrollIntoView({ behavior: 'smooth' });
      });

      tagSection.appendChild(link);
    });

    navSidebar.appendChild(tagSection);
  });

  document.body.appendChild(navSidebar);

  // Close sidebar when clicking outside
  document.addEventListener('click', event => {
    const isClickInside = navSidebar.contains(event.target) || toggleBtn.contains(event.target);
    if (!isClickInside) {
      navSidebar.classList.add('collapsed');
    }
  });
}
