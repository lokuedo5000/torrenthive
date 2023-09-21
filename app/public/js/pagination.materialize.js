class Pagination {
  constructor(data, itemsPerPage, paginationContainerId, collectionContainerId, templateFunction) {
    this.data = data;
    this.itemsPerPage = itemsPerPage;
    this.paginationContainer = document.getElementById(paginationContainerId);
    this.collectionContainer = document.getElementById(collectionContainerId);
    this.currentPage = 1;
    this.pageCount = Math.ceil(data.length / itemsPerPage);
    this.templateFunction = templateFunction || this.defaultTemplate;

    this.prevPageLink = document.createElement("a");
    this.prevPageLink.href = "#!";
    this.prevPageLink.classList.add("waves-effect");
    this.prevPageLink.innerHTML = "&laquo;";
    this.prevPageLink.addEventListener("click", () => {
      this.prevPage();
    });

    this.nextPageLink = document.createElement("a");
    this.nextPageLink.href = "#!";
    this.nextPageLink.classList.add("waves-effect");
    this.nextPageLink.innerHTML = "&raquo;";
    this.nextPageLink.addEventListener("click", () => {
      this.nextPage();
    });

    this.prevPageItem = document.createElement("li");
    this.prevPageItem.classList.add("disabled");
    this.prevPageItem.appendChild(this.prevPageLink);

    this.nextPageItem = document.createElement("li");
    this.nextPageItem.classList.add("waves-effect");
    this.nextPageItem.appendChild(this.nextPageLink);

    this.updatePagination();
  }

  defaultTemplate(item) {
    const listItem = document.createElement("li");
    listItem.classList.add("collection-item");
    listItem.textContent = item.name;
    return listItem;
  }

  displayPage(page) {
    const startIndex = (page - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    const pageItems = this.data.slice(startIndex, endIndex);

    this.collectionContainer.innerHTML = "";

    pageItems.forEach(async (item) => {
      const listItem = await this.templateFunction(item);
      this.collectionContainer.appendChild(listItem);
    });
  }

  updatePagination() {
    this.paginationContainer.innerHTML = "";

    const startPage = Math.max(1, this.currentPage - 2);
    const endPage = Math.min(this.pageCount, startPage + 4);

    for (let i = startPage; i <= endPage; i++) {
      const pageLink = document.createElement("a");
      pageLink.href = "#!";
      pageLink.classList.add("waves-effect");
      pageLink.textContent = i;
      pageLink.addEventListener("click", () => {
        this.goToPage(i);
      });

      const pageItem = document.createElement("li");
      pageItem.classList.add("waves-effect");
      if (i === this.currentPage) {
        pageItem.classList.add("active");
      }
      pageItem.appendChild(pageLink);

      this.paginationContainer.appendChild(pageItem);
    }

    this.prevPageItem.classList.toggle("disabled", this.currentPage === 1);
    this.nextPageItem.classList.toggle("disabled", this.currentPage === this.pageCount);

    this.paginationContainer.prepend(this.prevPageItem);
    this.paginationContainer.appendChild(this.nextPageItem);
  }

  goToPage(page) {
    if (page >= 1 && page <= this.pageCount) {
      this.currentPage = page;
      this.displayPage(this.currentPage);
      this.updatePagination();
    }
  }

  prevPage() {
    this.goToPage(this.currentPage - 1);
  }

  nextPage() {
    this.goToPage(this.currentPage + 1);
  }

  update() {
    this.displayPage(this.currentPage);
    this.updatePagination();
  }
}
